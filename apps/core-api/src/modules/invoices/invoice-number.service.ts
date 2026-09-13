import type { CoreDbClient } from "../../common/database/core-db-client.js";

export type InvoiceNumberService = {
  nextNumber(input: { organizationId: string; year: number }): Promise<string>;
};

export function createInvoiceNumberService(client: CoreDbClient): InvoiceNumberService {
  return {
    async nextNumber(input) {
      const existing = await client.invoiceNumberSequence.findUnique({
        where: {
          organizationId_year: {
            organizationId: input.organizationId,
            year: input.year
          }
        }
      });

      if (!existing) {
        await client.invoiceNumberSequence.create({
          data: {
            organizationId: input.organizationId,
            year: input.year,
            lastNumber: 1
          }
        });

        return formatNumber(input.year, 1);
      }

      const updated = await client.invoiceNumberSequence.update({
        data: { lastNumber: { increment: 1 } },
        where: {
          organizationId_year: {
            organizationId: input.organizationId,
            year: input.year
          }
        }
      });

      return formatNumber(input.year, updated.lastNumber);
    }
  };
}

function formatNumber(year: number, sequence: number): string {
  return `INV-${year}-${String(sequence).padStart(5, "0")}`;
}
