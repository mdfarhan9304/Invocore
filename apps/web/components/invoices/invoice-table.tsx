import Link from "next/link";

import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type { InvoiceSummary } from "@/lib/api/types";
import { formatCurrency, formatDate } from "@/lib/format";

type InvoiceTableProps = {
  invoices: InvoiceSummary[];
};

export function InvoiceTable({ invoices }: InvoiceTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Client</TableHead>
          <TableHead className="hidden sm:table-cell">Status</TableHead>
          <TableHead className="hidden md:table-cell">Date</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right hidden sm:table-cell">Balance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell>
              <Link
                href={`/invoices/${invoice.id}`}
                className="font-medium text-blue-600 hover:underline"
              >
                {invoice.invoiceNumber ?? "Draft"}
              </Link>
            </TableCell>
            <TableCell>{invoice.clientName}</TableCell>
            <TableCell className="hidden sm:table-cell">
              <InvoiceStatusBadge status={invoice.status} />
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {invoice.issueDate ? formatDate(invoice.issueDate) : "—"}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(invoice.total, invoice.currency)}
            </TableCell>
            <TableCell className="text-right hidden sm:table-cell">
              {formatCurrency(invoice.balanceDue, invoice.currency)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
