import type { InvoiceStatus, PrismaClient } from "@invocore/database";
import { Prisma } from "@invocore/database";

import type { CoreDbClient } from "../../common/database/core-db-client.js";

export type InvoiceLineItemRecord = {
  id: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
  lineTax: number;
  sortOrder: number;
};

export type InvoiceRecord = {
  id: string;
  organizationId: string;
  clientId: string;
  clientName: string;
  invoiceNumber: string | null;
  status: InvoiceStatus;
  issueDate: Date | null;
  dueDate: Date | null;
  currency: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  notes: string | null;
  terms: string | null;
  version: number;
  lineItems: InvoiceLineItemRecord[];
  createdAt: Date;
  updatedAt: Date;
};

export type InvoiceSummaryRecord = {
  id: string;
  clientId: string;
  clientName: string;
  invoiceNumber: string | null;
  status: InvoiceStatus;
  issueDate: Date | null;
  dueDate: Date | null;
  currency: string;
  total: number;
  amountPaid: number;
  balanceDue: number;
  createdAt: Date;
};

const lineItemSelect = {
  id: true,
  productId: true,
  description: true,
  quantity: true,
  unitPrice: true,
  taxRate: true,
  lineTotal: true,
  lineTax: true,
  sortOrder: true
} satisfies Prisma.InvoiceLineItemSelect;

const invoiceWithItemsSelect = {
  id: true,
  organizationId: true,
  clientId: true,
  client: { select: { name: true } },
  invoiceNumber: true,
  status: true,
  issueDate: true,
  dueDate: true,
  currency: true,
  subtotal: true,
  taxTotal: true,
  total: true,
  amountPaid: true,
  balanceDue: true,
  notes: true,
  terms: true,
  version: true,
  lineItems: { select: lineItemSelect, orderBy: { sortOrder: "asc" as const } },
  createdAt: true,
  updatedAt: true
} satisfies Prisma.InvoiceSelect;

const invoiceSummarySelect = {
  id: true,
  clientId: true,
  client: { select: { name: true } },
  invoiceNumber: true,
  status: true,
  issueDate: true,
  dueDate: true,
  currency: true,
  total: true,
  amountPaid: true,
  balanceDue: true,
  createdAt: true
} satisfies Prisma.InvoiceSelect;

type RawInvoice = Prisma.InvoiceGetPayload<{ select: typeof invoiceWithItemsSelect }>;
type RawSummary = Prisma.InvoiceGetPayload<{ select: typeof invoiceSummarySelect }>;

function toInvoiceRecord(raw: RawInvoice): InvoiceRecord {
  return {
    id: raw.id,
    organizationId: raw.organizationId,
    clientId: raw.clientId,
    clientName: raw.client.name,
    invoiceNumber: raw.invoiceNumber,
    status: raw.status,
    issueDate: raw.issueDate,
    dueDate: raw.dueDate,
    currency: raw.currency,
    subtotal: raw.subtotal,
    taxTotal: raw.taxTotal,
    total: raw.total,
    amountPaid: raw.amountPaid,
    balanceDue: raw.balanceDue,
    notes: raw.notes,
    terms: raw.terms,
    version: raw.version,
    lineItems: raw.lineItems,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt
  };
}

function toSummaryRecord(raw: RawSummary): InvoiceSummaryRecord {
  return {
    id: raw.id,
    clientId: raw.clientId,
    clientName: raw.client.name,
    invoiceNumber: raw.invoiceNumber,
    status: raw.status,
    issueDate: raw.issueDate,
    dueDate: raw.dueDate,
    currency: raw.currency,
    total: raw.total,
    amountPaid: raw.amountPaid,
    balanceDue: raw.balanceDue,
    createdAt: raw.createdAt
  };
}

function buildListWhere(
  organizationId: string,
  filters: { status?: string; clientId?: string; search?: string }
): Prisma.InvoiceWhereInput {
  const where: Prisma.InvoiceWhereInput = { organizationId };

  if (filters.status) {
    where.status = filters.status as InvoiceStatus;
  }
  if (filters.clientId) {
    where.clientId = filters.clientId;
  }
  if (filters.search) {
    where.OR = [
      { invoiceNumber: { contains: filters.search, mode: "insensitive" } },
      { client: { name: { contains: filters.search, mode: "insensitive" } } }
    ];
  }

  return where;
}

export type InvoicesRepository = {
  create(input: {
    organizationId: string;
    clientId: string;
    currency: string;
    issueDate?: Date;
    dueDate?: Date;
    notes?: string;
    terms?: string;
    lineItems: Array<{
      productId?: string;
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      lineTotal: number;
      lineTax: number;
      sortOrder: number;
    }>;
    subtotal: number;
    taxTotal: number;
    total: number;
    balanceDue: number;
  }): Promise<InvoiceRecord>;

  findById(input: { id: string; organizationId: string }): Promise<InvoiceRecord | null>;

  list(input: {
    organizationId: string;
    limit: number;
    offset: number;
    status?: string;
    clientId?: string;
    search?: string;
  }): Promise<{ records: InvoiceSummaryRecord[]; total: number }>;

  updateDraft(input: {
    id: string;
    organizationId: string;
    expectedVersion: number;
    data: {
      clientId?: string;
      issueDate?: Date | null;
      dueDate?: Date | null;
      notes?: string | null;
      terms?: string | null;
      subtotal?: number;
      taxTotal?: number;
      total?: number;
      balanceDue?: number;
    };
    replaceLineItems?: Array<{
      productId?: string;
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      lineTotal: number;
      lineTax: number;
      sortOrder: number;
    }>;
  }): Promise<InvoiceRecord | null>;

  updateStatus(input: {
    id: string;
    organizationId: string;
    expectedVersion: number;
    status: InvoiceStatus;
    invoiceNumber?: string;
    issueDate?: Date;
  }): Promise<InvoiceRecord | null>;

  remove(input: { id: string; organizationId: string }): Promise<boolean>;

  withTransaction<T>(operation: (client: CoreDbClient) => Promise<T>): Promise<T>;
};

export function createInvoicesRepository(
  client: CoreDbClient & Pick<PrismaClient, "$transaction">
): InvoicesRepository {
  return {
    async create(input) {
      const raw = await client.invoice.create({
        data: {
          organizationId: input.organizationId,
          clientId: input.clientId,
          currency: input.currency,
          issueDate: input.issueDate,
          dueDate: input.dueDate,
          notes: input.notes,
          terms: input.terms,
          subtotal: input.subtotal,
          taxTotal: input.taxTotal,
          total: input.total,
          balanceDue: input.balanceDue,
          lineItems: {
            create: input.lineItems
          }
        },
        select: invoiceWithItemsSelect
      });

      return toInvoiceRecord(raw);
    },

    async findById(input) {
      const raw = await client.invoice.findFirst({
        select: invoiceWithItemsSelect,
        where: { id: input.id, organizationId: input.organizationId }
      });

      return raw ? toInvoiceRecord(raw) : null;
    },

    async list(input) {
      const where = buildListWhere(input.organizationId, {
        status: input.status,
        clientId: input.clientId,
        search: input.search
      });

      const [rawRecords, total] = await Promise.all([
        client.invoice.findMany({
          orderBy: { createdAt: "desc" },
          select: invoiceSummarySelect,
          skip: input.offset,
          take: input.limit,
          where
        }),
        client.invoice.count({ where })
      ]);

      return { records: rawRecords.map(toSummaryRecord), total };
    },

    async updateDraft(input) {
      const updated = await client.invoice.updateMany({
        data: {
          ...input.data,
          version: { increment: 1 }
        },
        where: {
          id: input.id,
          organizationId: input.organizationId,
          status: "DRAFT",
          version: input.expectedVersion
        }
      });

      if (updated.count === 0) {
        return null;
      }

      if (input.replaceLineItems) {
        await client.invoiceLineItem.deleteMany({ where: { invoiceId: input.id } });
        await client.invoiceLineItem.createMany({
          data: input.replaceLineItems.map((item) => ({
            invoiceId: input.id,
            ...item
          }))
        });
      }

      const raw = await client.invoice.findFirst({
        select: invoiceWithItemsSelect,
        where: { id: input.id, organizationId: input.organizationId }
      });

      return raw ? toInvoiceRecord(raw) : null;
    },

    async updateStatus(input) {
      const data: Prisma.InvoiceUpdateManyMutationInput = {
        status: input.status,
        version: { increment: 1 }
      };

      if (input.invoiceNumber) {
        data.invoiceNumber = input.invoiceNumber;
      }
      if (input.issueDate) {
        data.issueDate = input.issueDate;
      }

      const updated = await client.invoice.updateMany({
        data,
        where: {
          id: input.id,
          organizationId: input.organizationId,
          version: input.expectedVersion
        }
      });

      if (updated.count === 0) {
        return null;
      }

      const raw = await client.invoice.findFirst({
        select: invoiceWithItemsSelect,
        where: { id: input.id, organizationId: input.organizationId }
      });

      return raw ? toInvoiceRecord(raw) : null;
    },

    async remove(input) {
      const deleted = await client.invoice.deleteMany({
        where: {
          id: input.id,
          organizationId: input.organizationId,
          status: "DRAFT"
        }
      });
      return deleted.count > 0;
    },

    withTransaction(operation) {
      return client.$transaction((tx) => operation(tx));
    }
  };
}
