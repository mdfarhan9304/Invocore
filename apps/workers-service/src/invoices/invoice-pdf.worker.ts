import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

import { loadConfig } from "@invocore/config";
import type { PrismaClient } from "@invocore/database";
import { createPrismaClient, InvoiceDocumentStatus } from "@invocore/database";
import { INVOICE_PDF_QUEUE, type InvoicePdfJob } from "@invocore/shared";
import { Redis } from "ioredis";
import { Worker } from "bullmq";

import { generateInvoicePdf } from "./invoice-pdf.js";

function formatDate(date: Date | null): string | null {
  return date ? date.toISOString().split("T")[0]! : null;
}

export type InvoicePdfWorker = {
  worker: Worker<InvoicePdfJob>;
  close(): Promise<void>;
};

export function createInvoicePdfWorker(
  redisUrl: string,
  dbClient: PrismaClient = createPrismaClient("core")
): InvoicePdfWorker {
  const config = loadConfig();
  const storageDirectory = resolve(config.storage.invoicePdfsDirectory);
  const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
  const worker = new Worker<InvoicePdfJob>(
    INVOICE_PDF_QUEUE,
    async (job) => {
      const document = await dbClient.invoiceDocument.findFirst({
        where: {
          id: job.data.documentId,
          invoiceId: job.data.invoiceId,
          organizationId: job.data.organizationId,
          invoiceVersion: job.data.invoiceVersion
        }
      });

      if (!document) {
        throw new Error("Invoice PDF document not found");
      }

      await dbClient.invoiceDocument.update({
        where: { id: document.id },
        data: { status: InvoiceDocumentStatus.PROCESSING, errorMessage: null }
      });

      try {
        const [invoice, organization] = await Promise.all([
          dbClient.invoice.findFirst({
            where: {
              id: job.data.invoiceId,
              organizationId: job.data.organizationId,
              version: job.data.invoiceVersion
            },
            include: {
              client: true,
              lineItems: { orderBy: { sortOrder: "asc" } }
            }
          }),
          dbClient.organization.findUnique({
            where: { id: job.data.organizationId },
            select: { name: true }
          })
        ]);

        if (!invoice || !organization) {
          throw new Error("Invoice data not found");
        }

        const addressParts = [
          invoice.client.addressLine1,
          invoice.client.addressLine2,
          [invoice.client.city, invoice.client.state, invoice.client.postalCode]
            .filter(Boolean)
            .join(", "),
          invoice.client.country
        ].filter(Boolean);

        const pdfBuffer = await generateInvoicePdf({
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          issueDate: formatDate(invoice.issueDate),
          dueDate: formatDate(invoice.dueDate),
          currency: invoice.currency,
          subtotal: invoice.subtotal,
          taxTotal: invoice.taxTotal,
          total: invoice.total,
          amountPaid: invoice.amountPaid,
          balanceDue: invoice.balanceDue,
          notes: invoice.notes,
          terms: invoice.terms,
          organizationName: organization.name,
          clientName: invoice.client.name,
          clientEmail: invoice.client.email,
          clientAddress: addressParts.length > 0 ? addressParts.join("\n") : null,
          lineItems: invoice.lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            lineTotal: item.lineTotal,
            lineTax: item.lineTax
          }))
        });

        const relativeStoragePath = join(
          job.data.organizationId,
          `${job.data.documentId}-v${job.data.invoiceVersion}.pdf`
        );
        const outputPath = resolve(storageDirectory, relativeStoragePath);
        const temporaryPath = `${outputPath}.tmp`;
        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(temporaryPath, pdfBuffer);
        await rename(temporaryPath, outputPath);

        await dbClient.invoiceDocument.update({
          where: { id: document.id },
          data: {
            status: InvoiceDocumentStatus.READY,
            storagePath: relative(storageDirectory, outputPath),
            errorMessage: null,
            completedAt: new Date()
          }
        });
      } catch (error) {
        const attempts = job.opts.attempts ?? 1;
        const isFinalAttempt = job.attemptsMade + 1 >= attempts;
        await dbClient.invoiceDocument.update({
          where: { id: document.id },
          data: {
            status: isFinalAttempt ? InvoiceDocumentStatus.FAILED : InvoiceDocumentStatus.QUEUED,
            errorMessage: isFinalAttempt ? "PDF generation failed." : null
          }
        });
        throw error;
      }
    },
    { connection, concurrency: 2 }
  );

  worker.on("failed", (job, error) => {
    console.warn(`invoice-pdf job ${job?.id ?? "unknown"} failed: ${error.message}`);
  });

  return {
    worker,
    async close() {
      await worker.close();
      await connection.quit();
      await dbClient.$disconnect();
    }
  };
}
