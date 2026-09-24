import { loadConfig } from "@invocore/config";
import { createPrismaClient } from "@invocore/database";

import { createInvoicePdfWorker } from "./invoices/invoice-pdf.worker.js";

const config = loadConfig();
const dbClient = createPrismaClient("core");
const invoicePdfWorker = createInvoicePdfWorker(config.redisUrl, dbClient);

console.warn("workers-service listening for invoice-pdf jobs");

const shutdown = async () => {
  await invoicePdfWorker.close();
  process.exit(0);
};

process.once("SIGINT", () => {
  void shutdown();
});

process.once("SIGTERM", () => {
  void shutdown();
});
