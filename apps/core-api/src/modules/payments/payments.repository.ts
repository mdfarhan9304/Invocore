import {
  type PrismaClient,
  InvoiceStatus,
  PaymentLinkStatus,
  PaymentStatus,
  Prisma
} from "@invocore/database";

import type { RazorpayPaymentLink, RazorpayWebhookPayload } from "./payment.types.js";

export class PaymentsRepository {
  constructor(private readonly client: PrismaClient) {}

  async findInvoiceForLink(invoiceId: string, organizationId: string) {
    return this.client.invoice.findFirst({
      where: { id: invoiceId, organizationId },
      include: { client: true }
    });
  }

  async findLinkByIdempotencyKey(idempotencyKey: string) {
    return this.client.paymentLink.findUnique({
      where: { idempotencyKey },
      include: { invoice: true }
    });
  }

  async createLink(data: {
    organizationId: string;
    invoiceId: string;
    invoiceVersion: number;
    amount: number;
    currency: string;
    idempotencyKey: string;
    expiresAt: Date | null;
  }) {
    return this.client.paymentLink.create({
      data: {
        ...data,
        provider: "RAZORPAY"
      }
    });
  }

  async saveProviderLink(
    id: string,
    data: {
      providerLinkId: string;
      paymentUrl: string;
      expiresAt: Date | null;
    }
  ) {
    return this.client.paymentLink.update({
      where: { id },
      data
    });
  }

  async deletePendingLink(id: string): Promise<void> {
    await this.client.paymentLink.deleteMany({
      where: { id, providerLinkId: null }
    });
  }

  async handleWebhook(
    eventId: string,
    event: RazorpayWebhookPayload,
    linkEntity: RazorpayPaymentLink
  ): Promise<void> {
    await this.client.$transaction(
      async (tx) => {
        const existingEvent = await tx.payment.findUnique({
          where: { webhookEventId: eventId }
        });
        if (existingEvent) {
          return;
        }

        const link = await tx.paymentLink.findFirst({
          where: {
            providerLinkId: linkEntity.id
          },
          include: { invoice: true }
        });
        if (!link) {
          return;
        }

        const paymentEntity = event.payload?.payment?.entity;
        const amount = paymentEntity?.amount ?? 0;
        if (amount > 0 && paymentEntity) {
          const isCaptured = paymentEntity.status === "captured";
          await tx.payment.create({
            data: {
              organizationId: link.organizationId,
              invoiceId: link.invoiceId,
              paymentLinkId: link.id,
              providerPaymentId: paymentEntity.id,
              webhookEventId: eventId,
              amount,
              currency: paymentEntity.currency,
              status: isCaptured ? PaymentStatus.CAPTURED : PaymentStatus.FAILED,
              method: paymentEntity.method,
              paidAt: isCaptured ? new Date(paymentEntity.created_at * 1000) : null,
              providerCreatedAt: new Date(paymentEntity.created_at * 1000)
            }
          });

          if (isCaptured) {
            const invoice = link.invoice;
            const nextAmountPaid = Math.min(invoice.total, invoice.amountPaid + amount);
            await tx.invoice.update({
              where: { id: invoice.id },
              data: {
                amountPaid: nextAmountPaid,
                balanceDue: Math.max(0, invoice.total - nextAmountPaid),
                status:
                  nextAmountPaid >= invoice.total
                    ? InvoiceStatus.PAID
                    : InvoiceStatus.PARTIALLY_PAID
              }
            });
          }
        }

        const status = this.getNextPaymentLinkStatus(
          link.status,
          this.getPaymentLinkStatus(linkEntity.status)
        );
        await tx.paymentLink.update({
          where: { id: link.id },
          data: {
            amountPaid: Math.max(link.amountPaid, Math.min(link.amount, linkEntity.amount_paid)),
            status
          }
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  }

  private getNextPaymentLinkStatus(
    current: PaymentLinkStatus,
    incoming: PaymentLinkStatus
  ): PaymentLinkStatus {
    const rank: Record<PaymentLinkStatus, number> = {
      ACTIVE: 0,
      PARTIALLY_PAID: 1,
      PAID: 4,
      CANCELLED: 3,
      EXPIRED: 3
    };
    return rank[incoming] > rank[current] ? incoming : current;
  }

  private getPaymentLinkStatus(status: RazorpayPaymentLink["status"]): PaymentLinkStatus {
    switch (status) {
      case "paid":
        return PaymentLinkStatus.PAID;
      case "partially_paid":
        return PaymentLinkStatus.PARTIALLY_PAID;
      case "cancelled":
        return PaymentLinkStatus.CANCELLED;
      case "expired":
        return PaymentLinkStatus.EXPIRED;
      default:
        return PaymentLinkStatus.ACTIVE;
    }
  }
}
