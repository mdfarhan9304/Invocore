import { InvoiceStatus } from "@invocore/database";
import { AppError } from "@invocore/shared";

type Action = "issue" | "markSent" | "recordPayment" | "markOverdue" | "cancel";

const TRANSITIONS: Record<
  InvoiceStatus,
  Partial<Record<Action, InvoiceStatus | InvoiceStatus[]>>
> = {
  DRAFT: {
    issue: InvoiceStatus.ISSUED,
    cancel: InvoiceStatus.CANCELLED
  },
  ISSUED: {
    markSent: InvoiceStatus.SENT,
    cancel: InvoiceStatus.CANCELLED
  },
  SENT: {
    recordPayment: [InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID],
    markOverdue: InvoiceStatus.OVERDUE,
    cancel: InvoiceStatus.CANCELLED
  },
  PARTIALLY_PAID: {
    recordPayment: [InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID],
    markOverdue: InvoiceStatus.OVERDUE
  },
  OVERDUE: {
    recordPayment: [InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID]
  },
  PAID: {},
  CANCELLED: {}
};

export function canTransition(from: InvoiceStatus, action: Action): boolean {
  return action in (TRANSITIONS[from] ?? {});
}

export function assertTransition(from: InvoiceStatus, action: Action): void {
  if (!canTransition(from, action)) {
    throw new AppError(
      `Cannot ${action} an invoice with status ${from}`,
      "INVALID_STATUS_TRANSITION",
      409
    );
  }
}
