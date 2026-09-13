"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  DownloadIcon,
  EditIcon,
  SendIcon,
  XCircleIcon
} from "lucide-react";

import { InvoiceForm } from "@/components/invoices/invoice-form";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import { invoicesApi } from "@/lib/api/invoices";
import type { Invoice } from "@/lib/api/types";
import { formatCurrency, formatDate } from "@/lib/format";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [acting, setActing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    invoicesApi
      .get(invoiceId)
      .then((result) => {
        setInvoice(result.invoice);
        setEditing(false);
      })
      .catch((loadError) => {
        setError(loadError instanceof ApiError ? loadError.message : "Failed to load invoice.");
      })
      .finally(() => setLoading(false));
  }, [invoiceId]);

  useEffect(load, [load]);

  async function doAction(
    action: "issue" | "send" | "cancel",
    handler: (id: string, version: number) => Promise<{ invoice: Invoice }>
  ) {
    if (!invoice || acting) return;
    setActing(true);
    setActionError(null);
    try {
      const result = await handler(invoiceId, invoice.version);
      setInvoice(result.invoice);
    } catch (actionErr) {
      setActionError(
        actionErr instanceof ApiError ? actionErr.message : `Failed to ${action} invoice.`
      );
    } finally {
      setActing(false);
    }
  }

  async function handleDelete() {
    if (!invoice || acting) return;
    if (!window.confirm("Delete this draft invoice? This cannot be undone.")) return;
    setActing(true);
    setActionError(null);
    try {
      await invoicesApi.remove(invoiceId);
      router.push("/invoices");
    } catch (deleteErr) {
      setActionError(
        deleteErr instanceof ApiError ? deleteErr.message : "Failed to delete invoice."
      );
      setActing(false);
    }
  }

  async function handleDownloadPdf() {
    if (downloading) return;
    setDownloading(true);
    setActionError(null);
    try {
      await invoicesApi.downloadPdf(invoiceId);
    } catch (dlError) {
      setActionError(dlError instanceof ApiError ? dlError.message : "Failed to download PDF.");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }
  if (error || !invoice) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/invoices">
            <ArrowLeftIcon className="h-4 w-4" /> Back
          </Link>
        </Button>
        <FormAlert>{error ?? "Invoice not found."}</FormAlert>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">Edit Invoice</h1>
        </div>
        <InvoiceForm invoice={invoice} />
      </div>
    );
  }

  const isDraft = invoice.status === "DRAFT";
  const isIssued = invoice.status === "ISSUED";
  const canCancel = ["DRAFT", "ISSUED", "SENT"].includes(invoice.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/invoices">
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold">{invoice.invoiceNumber ?? "Draft Invoice"}</h1>
          <InvoiceStatusBadge status={invoice.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          {isDraft && (
            <>
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                <EditIcon className="h-4 w-4" /> Edit
              </Button>
              <Button
                size="sm"
                disabled={acting}
                onClick={() => doAction("issue", invoicesApi.issue)}
              >
                <CheckCircleIcon className="h-4 w-4" /> Issue
              </Button>
              <Button variant="destructive" size="sm" disabled={acting} onClick={handleDelete}>
                Delete draft
              </Button>
            </>
          )}
          {isIssued && (
            <Button size="sm" disabled={acting} onClick={() => doAction("send", invoicesApi.send)}>
              <SendIcon className="h-4 w-4" /> Mark as Sent
            </Button>
          )}
          {canCancel && !isDraft && (
            <Button
              variant="destructive"
              size="sm"
              disabled={acting}
              onClick={() => doAction("cancel", invoicesApi.cancel)}
            >
              <XCircleIcon className="h-4 w-4" /> Cancel
            </Button>
          )}
          <Button variant="secondary" size="sm" disabled={downloading} onClick={handleDownloadPdf}>
            <DownloadIcon className="h-4 w-4" /> {downloading ? "Generating…" : "Download PDF"}
          </Button>
        </div>
      </div>

      {actionError && <FormAlert>{actionError}</FormAlert>}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="Client" value={invoice.clientName} />
        <InfoCard
          label="Issue Date"
          value={invoice.issueDate ? formatDate(invoice.issueDate) : "—"}
        />
        <InfoCard label="Due Date" value={invoice.dueDate ? formatDate(invoice.dueDate) : "—"} />
        <InfoCard label="Currency" value={invoice.currency} />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Line Items</h3>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                <th className="px-3 py-2 font-medium">#</th>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 font-medium text-right">Qty</th>
                <th className="px-3 py-2 font-medium text-right">Unit Price</th>
                <th className="px-3 py-2 font-medium text-right">Tax %</th>
                <th className="px-3 py-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item, i) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2">{item.description}</td>
                  <td className="px-3 py-2 text-right">{item.quantity}</td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(item.unitPrice, invoice.currency)}
                  </td>
                  <td className="px-3 py-2 text-right">{(item.taxRate / 100).toFixed(2)}%</td>
                  <td className="px-3 py-2 text-right font-medium">
                    {formatCurrency(item.lineTotal + item.lineTax, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <div className="w-72 space-y-1 rounded-md border p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatCurrency(invoice.taxTotal, invoice.currency)}</span>
          </div>
          <div className="flex justify-between border-t pt-1 font-semibold">
            <span>Total</span>
            <span>{formatCurrency(invoice.total, invoice.currency)}</span>
          </div>
          {invoice.amountPaid > 0 && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid</span>
                <span>{formatCurrency(invoice.amountPaid, invoice.currency)}</span>
              </div>
              <div className="flex justify-between font-semibold text-destructive">
                <span>Balance Due</span>
                <span>{formatCurrency(invoice.balanceDue, invoice.currency)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {(invoice.notes || invoice.terms) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {invoice.notes && (
            <div>
              <h4 className="mb-1 text-sm font-semibold">Notes</h4>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{invoice.notes}</p>
            </div>
          )}
          {invoice.terms && (
            <div>
              <h4 className="mb-1 text-sm font-semibold">Terms</h4>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{invoice.terms}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
