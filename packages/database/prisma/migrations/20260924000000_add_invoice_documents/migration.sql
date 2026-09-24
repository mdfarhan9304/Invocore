CREATE TYPE "InvoiceDocumentStatus" AS ENUM ('QUEUED', 'PROCESSING', 'READY', 'FAILED');

CREATE TABLE "invoice_documents" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "invoice_version" INTEGER NOT NULL,
    "status" "InvoiceDocumentStatus" NOT NULL DEFAULT 'QUEUED',
    "storage_path" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "invoice_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invoice_documents_invoice_id_invoice_version_key" ON "invoice_documents"("invoice_id", "invoice_version");

CREATE INDEX "invoice_documents_organization_id_status_idx" ON "invoice_documents"("organization_id", "status");

ALTER TABLE "invoice_documents" ADD CONSTRAINT "invoice_documents_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
