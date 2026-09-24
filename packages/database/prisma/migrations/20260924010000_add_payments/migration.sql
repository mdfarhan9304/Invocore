CREATE TYPE "PaymentLinkStatus" AS ENUM ('ACTIVE', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'EXPIRED');

CREATE TYPE "PaymentStatus" AS ENUM ('CAPTURED', 'FAILED');

CREATE TABLE "payment_links" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "invoice_version" INTEGER NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'RAZORPAY',
    "provider_link_id" TEXT,
    "payment_url" TEXT,
    "amount" INTEGER NOT NULL,
    "amount_paid" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL,
    "status" "PaymentLinkStatus" NOT NULL DEFAULT 'ACTIVE',
    "idempotency_key" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "payment_link_id" UUID,
    "provider_payment_id" TEXT NOT NULL,
    "webhook_event_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "method" TEXT,
    "paid_at" TIMESTAMP(3),
    "provider_created_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_links_provider_link_id_key" ON "payment_links"("provider_link_id");

CREATE UNIQUE INDEX "payment_links_idempotency_key_key" ON "payment_links"("idempotency_key");

CREATE INDEX "payment_links_organization_id_status_idx" ON "payment_links"("organization_id", "status");

CREATE INDEX "payment_links_invoice_id_invoice_version_idx" ON "payment_links"("invoice_id", "invoice_version");

CREATE UNIQUE INDEX "payments_provider_payment_id_key" ON "payments"("provider_payment_id");

CREATE UNIQUE INDEX "payments_webhook_event_id_key" ON "payments"("webhook_event_id");

CREATE INDEX "payments_organization_id_status_idx" ON "payments"("organization_id", "status");

CREATE INDEX "payments_invoice_id_created_at_idx" ON "payments"("invoice_id", "created_at");

ALTER TABLE "payment_links" ADD CONSTRAINT "payment_links_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_link_id_fkey" FOREIGN KEY ("payment_link_id") REFERENCES "payment_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;
