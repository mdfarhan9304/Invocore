import { Redis } from "ioredis";

import { invoicePdfChannel, type InvoicePdfEvent } from "@invocore/shared";

export type InvoicePdfEventSubscription = {
  close(): Promise<void>;
};

export async function subscribeToInvoicePdfEvents(
  redisUrl: string,
  organizationId: string,
  invoiceId: string,
  onEvent: (event: InvoicePdfEvent) => void
): Promise<InvoicePdfEventSubscription> {
  const subscriber = new Redis(redisUrl, { maxRetriesPerRequest: null });
  const channel = invoicePdfChannel(organizationId, invoiceId);

  await subscriber.subscribe(channel);
  subscriber.on("message", (receivedChannel, message) => {
    if (receivedChannel !== channel) {
      return;
    }

    try {
      onEvent(JSON.parse(message) as InvoicePdfEvent);
    } catch {
      return;
    }
  });

  return {
    async close() {
      await subscriber.unsubscribe(channel);
      await subscriber.quit();
    }
  };
}
