export const ROLES = ["OWNER", "ADMIN", "ACCOUNTANT", "VIEWER"] as const;

export type Role = (typeof ROLES)[number];

export const INVOICE_PDF_QUEUE = "invoice-pdf";

export type InvoicePdfJob = {
  documentId: string;
  invoiceId: string;
  organizationId: string;
  invoiceVersion: number;
};

export type InvoiceDocumentStatus = "QUEUED" | "PROCESSING" | "READY" | "FAILED";

export type InvoicePdfStatusResponse = {
  document: {
    id: string;
    status: InvoiceDocumentStatus;
    invoiceVersion: number;
    error: string | null;
  };
};

export type HealthResponse = {
  service: string;
  status: "ok";
};

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number
  ) {
    super(message);
  }
}
