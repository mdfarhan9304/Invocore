import { InvoiceStatus } from "@invocore/database";
import { AppError } from "@invocore/shared";

import {
  createRazorpayPaymentLink,
  parseRazorpayWebhook,
  verifyRazorpayWebhookSignature
} from "./razorpay.service.js";
import type { RazorpayWebhookPayload } from "./payment.types.js";
import type { PaymentsRepository } from "./payments.repository.js";

const PAYMENT_LINK_EVENTS = new Set([
  "payment_link.paid",
  "payment_link.partially_paid",
  "payment_link.cancelled",
  "payment_link.expired"
]);

const PAYABLE_INVOICE_STATUSES = new Set<InvoiceStatus>([
  InvoiceStatus.ISSUED,
  InvoiceStatus.SENT,
  InvoiceStatus.PARTIALLY_PAID,
  InvoiceStatus.OVERDUE
]);

function buildRazorpayCustomer(client: {
  name: string;
  email: string | null;
  phone: string | null;
}) {
  const customer: { name: string; email?: string; contact?: string } = { name: client.name };
  if (client.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email)) {
    customer.email = client.email;
  }

  const contact = client.phone?.replace(/\D/g, "");
  if (contact && contact.length >= 8 && contact.length <= 14) {
    customer.contact = contact;
  }

  return customer;
}

export class PaymentsService {
  constructor(private readonly repository: PaymentsRepository) {}

  async createPaymentLink(invoiceId: string, organizationId: string) {
    const invoice = await this.repository.findInvoiceForLink(invoiceId, organizationId);
    if (!invoice) {
      throw new AppError("Invoice not found", "INVOICE_NOT_FOUND", 404);
    }
    if (!PAYABLE_INVOICE_STATUSES.has(invoice.status)) {
      throw new AppError(
        "Invoice must be issued before collecting payment",
        "INVOICE_NOT_PAYABLE",
        409
      );
    }
    if (invoice.currency !== "INR") {
      throw new AppError(
        "Razorpay payment links currently support INR invoices only",
        "PAYMENT_CURRENCY_UNSUPPORTED",
        409
      );
    }

    const amount = invoice.balanceDue || invoice.total - invoice.amountPaid;
    if (amount <= 0) {
      throw new AppError("Invoice is already paid", "INVOICE_ALREADY_PAID", 409);
    }

    const idempotencyKey = `${invoice.id}:${invoice.version}`;
    const existing = await this.repository.findLinkByIdempotencyKey(idempotencyKey);
    if (existing?.paymentUrl) {
      return this.toPaymentLinkResponse(existing);
    }

    const dueDateEnd = invoice.dueDate
      ? new Date(`${invoice.dueDate.toISOString().slice(0, 10)}T23:59:59.000Z`)
      : null;
    const expiresAt = dueDateEnd && dueDateEnd > new Date() ? dueDateEnd : null;
    const pendingLink =
      existing ??
      (await this.repository.createLink({
        organizationId,
        invoiceId: invoice.id,
        invoiceVersion: invoice.version,
        amount,
        currency: invoice.currency,
        idempotencyKey,
        expiresAt
      }));

    try {
      const providerLink = await createRazorpayPaymentLink({
        amount,
        currency: invoice.currency,
        referenceId: invoice.id,
        description: invoice.invoiceNumber
          ? `Payment for invoice ${invoice.invoiceNumber}`
          : `Payment for invoice ${invoice.id}`,
        customer: buildRazorpayCustomer(invoice.client),
        expiresAt
      });
      const savedLink = await this.repository.saveProviderLink(pendingLink.id, {
        providerLinkId: providerLink.id,
        paymentUrl: providerLink.short_url,
        expiresAt: providerLink.expire_by ? new Date(providerLink.expire_by * 1000) : expiresAt
      });
      return this.toPaymentLinkResponse(savedLink);
    } catch (error) {
      if (!existing) {
        await this.repository.deletePendingLink(pendingLink.id);
      }
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Unable to create payment link", "PAYMENT_LINK_CREATE_FAILED", 502);
    }
  }

  async handleWebhook(rawBody: Buffer, signature: string | undefined, eventId: string | undefined) {
    if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
      throw new AppError("Invalid webhook signature", "INVALID_WEBHOOK_SIGNATURE", 400);
    }
    if (!eventId) {
      throw new AppError("Missing webhook event id", "WEBHOOK_EVENT_ID_REQUIRED", 400);
    }

    let event: RazorpayWebhookPayload;
    try {
      event = parseRazorpayWebhook(rawBody);
    } catch {
      throw new AppError("Invalid webhook payload", "INVALID_WEBHOOK_PAYLOAD", 400);
    }

    const linkEntity = event.payload?.payment_link?.entity;
    if (!linkEntity || !PAYMENT_LINK_EVENTS.has(event.event)) {
      return { received: true, ignored: true };
    }

    await this.repository.handleWebhook(eventId, event, linkEntity);
    return { received: true };
  }

  private toPaymentLinkResponse(link: {
    id: string;
    paymentUrl: string | null;
    amount: number;
    amountPaid: number;
    currency: string;
    status: string;
    expiresAt: Date | null;
  }) {
    if (!link.paymentUrl) {
      throw new AppError("Payment link is not ready", "PAYMENT_LINK_NOT_READY", 409);
    }
    return {
      id: link.id,
      url: link.paymentUrl,
      amount: link.amount,
      amountPaid: link.amountPaid,
      currency: link.currency,
      status: link.status,
      expiresAt: link.expiresAt
    };
  }
}
