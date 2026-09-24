import { Redis } from "ioredis";
import { Queue } from "bullmq";

import { INVOICE_PDF_QUEUE, type InvoicePdfJob } from "@invocore/shared";

export type InvoicePdfQueue = {
  add(job: InvoicePdfJob): Promise<void>;
  remove(jobId: string): Promise<void>;
  close(): Promise<void>;
};

export function createInvoicePdfQueue(redisUrl: string): InvoicePdfQueue {
  const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
  const queue = new Queue<InvoicePdfJob>(INVOICE_PDF_QUEUE, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000
      },
      removeOnComplete: 100,
      removeOnFail: 100
    }
  });

  return {
    async add(job) {
      await queue.add("render-invoice-pdf", job, { jobId: job.documentId });
    },
    async remove(jobId) {
      await queue.remove(jobId);
    },
    async close() {
      await queue.close();
      await connection.quit();
    }
  };
}
