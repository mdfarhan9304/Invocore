import { InvoiceStatus } from "@invocore/database";
import { AppError } from "@invocore/shared";

import type { CoreDbClient } from "../../common/database/core-db-client.js";
import type {
  CreateInvoiceRequestDto,
  CreateLineItemInput,
  InvoiceDto,
  InvoiceLineItemDto,
  InvoiceListDto,
  InvoiceSummaryDto,
  ListInvoicesQuery,
  UpdateInvoiceRequestDto,
  UpdateLineItemInput
} from "./dto/invoices.dto.js";
import { createInvoiceNumberService } from "./invoice-number.service.js";
import { assertTransition } from "./invoice-transitions.js";
import type {
  InvoiceLineItemRecord,
  InvoiceRecord,
  InvoicesRepository,
  InvoiceSummaryRecord
} from "./invoices.repository.js";
import { createInvoicesRepository } from "./invoices.repository.js";

function computeLineItem(
  input: CreateLineItemInput | UpdateLineItemInput,
  index: number
): { lineTotal: number; lineTax: number; taxRate: number; sortOrder: number } {
  const taxRate = input.taxRate ?? 0;
  const lineTotal = input.quantity * input.unitPrice;
  const lineTax = Math.round((lineTotal * taxRate) / 10_000);
  return { lineTotal, lineTax, taxRate, sortOrder: index };
}

function computeTotals(
  items: Array<{ lineTotal: number; lineTax: number }>,
  amountPaid: number
): { subtotal: number; taxTotal: number; total: number; balanceDue: number } {
  let subtotal = 0;
  let taxTotal = 0;
  for (const item of items) {
    subtotal += item.lineTotal;
    taxTotal += item.lineTax;
  }
  const total = subtotal + taxTotal;
  return { subtotal, taxTotal, total, balanceDue: total - amountPaid };
}

function formatDate(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().split("T")[0]!;
}

function toLineItemDto(record: InvoiceLineItemRecord): InvoiceLineItemDto {
  return {
    id: record.id,
    productId: record.productId,
    description: record.description,
    quantity: record.quantity,
    unitPrice: record.unitPrice,
    taxRate: record.taxRate,
    lineTotal: record.lineTotal,
    lineTax: record.lineTax,
    sortOrder: record.sortOrder
  };
}

function toInvoiceDto(record: InvoiceRecord): InvoiceDto {
  return {
    id: record.id,
    clientId: record.clientId,
    clientName: record.clientName,
    invoiceNumber: record.invoiceNumber,
    status: record.status,
    issueDate: formatDate(record.issueDate),
    dueDate: formatDate(record.dueDate),
    currency: record.currency,
    subtotal: record.subtotal,
    taxTotal: record.taxTotal,
    total: record.total,
    amountPaid: record.amountPaid,
    balanceDue: record.balanceDue,
    notes: record.notes,
    terms: record.terms,
    version: record.version,
    lineItems: record.lineItems.map(toLineItemDto),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function toSummaryDto(record: InvoiceSummaryRecord): InvoiceSummaryDto {
  return {
    id: record.id,
    clientId: record.clientId,
    clientName: record.clientName,
    invoiceNumber: record.invoiceNumber,
    status: record.status,
    issueDate: formatDate(record.issueDate),
    dueDate: formatDate(record.dueDate),
    currency: record.currency,
    total: record.total,
    amountPaid: record.amountPaid,
    balanceDue: record.balanceDue,
    createdAt: record.createdAt.toISOString()
  };
}

function invoiceNotFound(): AppError {
  return new AppError("Invoice not found", "INVOICE_NOT_FOUND", 404);
}

function versionConflict(): AppError {
  return new AppError(
    "Invoice was modified by another user. Please refresh and try again.",
    "VERSION_CONFLICT",
    409
  );
}

function parseIsoDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00.000Z");
}

export type InvoicesService = {
  createInvoice(input: {
    data: CreateInvoiceRequestDto;
    organizationId: string;
  }): Promise<InvoiceDto>;

  getInvoice(input: { invoiceId: string; organizationId: string }): Promise<InvoiceDto>;

  listInvoices(input: {
    organizationId: string;
    query: ListInvoicesQuery;
  }): Promise<InvoiceListDto>;

  updateInvoice(input: {
    invoiceId: string;
    organizationId: string;
    expectedVersion: number;
    data: UpdateInvoiceRequestDto;
  }): Promise<InvoiceDto>;

  deleteInvoice(input: { invoiceId: string; organizationId: string }): Promise<void>;

  issueInvoice(input: {
    invoiceId: string;
    organizationId: string;
    expectedVersion: number;
  }): Promise<InvoiceDto>;

  sendInvoice(input: {
    invoiceId: string;
    organizationId: string;
    expectedVersion: number;
  }): Promise<InvoiceDto>;

  cancelInvoice(input: {
    invoiceId: string;
    organizationId: string;
    expectedVersion: number;
  }): Promise<InvoiceDto>;

  getInvoicePdfData(input: { invoiceId: string; organizationId: string }): Promise<{
    invoice: InvoiceDto;
    organizationName: string;
    clientEmail: string | null;
    clientAddress: string | null;
  }>;
};

export function createInvoicesService(
  invoicesRepository: InvoicesRepository,
  dbClient: CoreDbClient
): InvoicesService {
  return {
    async createInvoice(input) {
      const computedItems = input.data.lineItems.map((item, index) => {
        const computed = computeLineItem(item, index);
        return {
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          ...computed
        };
      });

      const totals = computeTotals(computedItems, 0);

      const record = await invoicesRepository.create({
        organizationId: input.organizationId,
        clientId: input.data.clientId,
        currency: input.data.currency ?? "USD",
        issueDate: input.data.issueDate ? parseIsoDate(input.data.issueDate) : undefined,
        dueDate: input.data.dueDate ? parseIsoDate(input.data.dueDate) : undefined,
        notes: input.data.notes,
        terms: input.data.terms,
        lineItems: computedItems,
        ...totals
      });

      return toInvoiceDto(record);
    },

    async getInvoice(input) {
      const record = await invoicesRepository.findById({
        id: input.invoiceId,
        organizationId: input.organizationId
      });
      if (!record) {
        throw invoiceNotFound();
      }
      return toInvoiceDto(record);
    },

    async listInvoices(input) {
      const { records, total } = await invoicesRepository.list({
        organizationId: input.organizationId,
        limit: input.query.limit,
        offset: input.query.offset,
        status: input.query.status,
        clientId: input.query.clientId,
        search: input.query.search
      });

      return {
        data: records.map(toSummaryDto),
        pagination: {
          limit: input.query.limit,
          offset: input.query.offset,
          total
        }
      };
    },

    async updateInvoice(input) {
      const existing = await invoicesRepository.findById({
        id: input.invoiceId,
        organizationId: input.organizationId
      });
      if (!existing) {
        throw invoiceNotFound();
      }

      if (existing.status !== InvoiceStatus.DRAFT) {
        throw new AppError("Only draft invoices can be edited", "INVOICE_NOT_EDITABLE", 409);
      }

      const updateData: Parameters<typeof invoicesRepository.updateDraft>[0]["data"] = {};
      let replaceLineItems: Parameters<
        typeof invoicesRepository.updateDraft
      >[0]["replaceLineItems"];

      if (input.data.clientId !== undefined) {
        updateData.clientId = input.data.clientId;
      }
      if (input.data.issueDate !== undefined) {
        updateData.issueDate =
          input.data.issueDate === null ? null : parseIsoDate(input.data.issueDate);
      }
      if (input.data.dueDate !== undefined) {
        updateData.dueDate = input.data.dueDate === null ? null : parseIsoDate(input.data.dueDate);
      }
      if (input.data.notes !== undefined) {
        updateData.notes = input.data.notes;
      }
      if (input.data.terms !== undefined) {
        updateData.terms = input.data.terms;
      }

      if (input.data.lineItems) {
        const computedItems = input.data.lineItems.map((item, index) => {
          const computed = computeLineItem(item, index);
          return {
            productId: item.productId ?? undefined,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            ...computed
          };
        });

        const totals = computeTotals(computedItems, existing.amountPaid);
        Object.assign(updateData, totals);
        replaceLineItems = computedItems;
      }

      const record = await invoicesRepository.updateDraft({
        id: input.invoiceId,
        organizationId: input.organizationId,
        expectedVersion: input.expectedVersion,
        data: updateData,
        replaceLineItems
      });

      if (!record) {
        throw versionConflict();
      }

      return toInvoiceDto(record);
    },

    async deleteInvoice(input) {
      const deleted = await invoicesRepository.remove({
        id: input.invoiceId,
        organizationId: input.organizationId
      });
      if (!deleted) {
        throw new AppError(
          "Invoice not found or cannot be deleted (only drafts can be deleted)",
          "INVOICE_NOT_FOUND",
          404
        );
      }
    },

    async issueInvoice(input) {
      const existing = await invoicesRepository.findById({
        id: input.invoiceId,
        organizationId: input.organizationId
      });
      if (!existing) {
        throw invoiceNotFound();
      }

      assertTransition(existing.status, "issue");

      if (existing.lineItems.length === 0) {
        throw new AppError(
          "Cannot issue an invoice with no line items",
          "INVOICE_NO_LINE_ITEMS",
          422
        );
      }

      const record = await invoicesRepository.withTransaction(async (txClient) => {
        const numberService = createInvoiceNumberService(txClient);
        const year = new Date().getFullYear();
        const invoiceNumber = await numberService.nextNumber({
          organizationId: input.organizationId,
          year
        });

        const txRepo = createInvoicesRepository(txClient as CoreDbClient & { $transaction: never });

        const updated = await txRepo.updateStatus({
          id: input.invoiceId,
          organizationId: input.organizationId,
          expectedVersion: input.expectedVersion,
          status: InvoiceStatus.ISSUED,
          invoiceNumber,
          issueDate: existing.issueDate ?? new Date()
        });

        return updated;
      });

      if (!record) {
        throw versionConflict();
      }

      return toInvoiceDto(record);
    },

    async sendInvoice(input) {
      const existing = await invoicesRepository.findById({
        id: input.invoiceId,
        organizationId: input.organizationId
      });
      if (!existing) {
        throw invoiceNotFound();
      }

      assertTransition(existing.status, "markSent");

      const record = await invoicesRepository.updateStatus({
        id: input.invoiceId,
        organizationId: input.organizationId,
        expectedVersion: input.expectedVersion,
        status: InvoiceStatus.SENT
      });

      if (!record) {
        throw versionConflict();
      }

      return toInvoiceDto(record);
    },

    async cancelInvoice(input) {
      const existing = await invoicesRepository.findById({
        id: input.invoiceId,
        organizationId: input.organizationId
      });
      if (!existing) {
        throw invoiceNotFound();
      }

      assertTransition(existing.status, "cancel");

      const record = await invoicesRepository.updateStatus({
        id: input.invoiceId,
        organizationId: input.organizationId,
        expectedVersion: input.expectedVersion,
        status: InvoiceStatus.CANCELLED
      });

      if (!record) {
        throw versionConflict();
      }

      return toInvoiceDto(record);
    },

    async getInvoicePdfData(input) {
      const record = await invoicesRepository.findById({
        id: input.invoiceId,
        organizationId: input.organizationId
      });
      if (!record) {
        throw invoiceNotFound();
      }

      const [org, client] = await Promise.all([
        dbClient.organization.findUnique({
          select: { name: true },
          where: { id: input.organizationId }
        }),
        dbClient.client.findFirst({
          select: {
            email: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            postalCode: true,
            country: true
          },
          where: { id: record.clientId, organizationId: input.organizationId }
        })
      ]);

      const addressParts = [
        client?.addressLine1,
        client?.addressLine2,
        [client?.city, client?.state, client?.postalCode].filter(Boolean).join(", "),
        client?.country
      ].filter(Boolean);

      return {
        invoice: toInvoiceDto(record),
        organizationName: org?.name ?? "Unknown",
        clientEmail: client?.email ?? null,
        clientAddress: addressParts.length > 0 ? addressParts.join("\n") : null
      };
    }
  };
}
