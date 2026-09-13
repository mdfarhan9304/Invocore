"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import {
  computeLineTotals,
  emptyRow,
  LineItemsEditor,
  type LineItemRow
} from "@/components/invoices/line-items-editor";
import { Button } from "@/components/ui/button";
import { Field, FormAlert } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { clientsApi } from "@/lib/api/clients";
import { invoicesApi } from "@/lib/api/invoices";
import { productsApi } from "@/lib/api/products";
import type {
  Client,
  CreateInvoiceInput,
  CreateLineItemInput,
  Invoice,
  Product
} from "@/lib/api/types";

function invoiceToRows(invoice: Invoice, products: Product[]): LineItemRow[] {
  return invoice.lineItems.map((item) => {
    const product = item.productId ? products.find((p) => p.id === item.productId) : null;
    return {
      key: item.id,
      productId: item.productId ?? "",
      description:
        product?.name && product.name === item.description ? product.name : item.description,
      quantity: String(item.quantity),
      unitPrice: (item.unitPrice / 100).toFixed(2),
      taxRate: (item.taxRate / 100).toFixed(2)
    };
  });
}

function parseCents(value: string): number {
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) return 0;
  return Math.round(num * 100);
}

function parseBasisPoints(value: string): number {
  const num = Number(value);
  if (Number.isNaN(num) || num < 0 || num > 100) return 0;
  return Math.round(num * 100);
}

function rowsToLineItems(rows: LineItemRow[]): CreateLineItemInput[] {
  return rows.map((row) => {
    const item: CreateLineItemInput = {
      description: row.description.trim(),
      quantity: Math.max(1, Math.floor(Number(row.quantity) || 1)),
      unitPrice: parseCents(row.unitPrice)
    };
    if (row.productId) {
      item.productId = row.productId;
    }
    const taxRate = parseBasisPoints(row.taxRate);
    if (taxRate > 0) {
      item.taxRate = taxRate;
    }
    return item;
  });
}

type InvoiceFormProps = {
  invoice?: Invoice;
};

export function InvoiceForm({ invoice }: InvoiceFormProps) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [clientId, setClientId] = useState(invoice?.clientId ?? "");
  const [issueDate, setIssueDate] = useState(invoice?.issueDate ?? "");
  const [dueDate, setDueDate] = useState(invoice?.dueDate ?? "");
  const [notes, setNotes] = useState(invoice?.notes ?? "");
  const [terms, setTerms] = useState(invoice?.terms ?? "");
  const [lineItems, setLineItems] = useState<LineItemRow[]>([emptyRow()]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([clientsApi.list({ limit: 100 }), productsApi.list({ limit: 100, active: true })])
      .then(([clientsResult, productsResult]) => {
        setClients(clientsResult.data);
        setProducts(productsResult.data);
        if (invoice) {
          setLineItems(invoiceToRows(invoice, productsResult.data));
        }
      })
      .finally(() => setLoading(false));
  }, [invoice]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!clientId) {
      setError("Please select a client.");
      return;
    }

    const validItems = lineItems.filter((row) => row.description.trim());
    if (validItems.length === 0) {
      setError("Add at least one line item with a description.");
      return;
    }

    const hasInvalidPrice = validItems.some((row) => {
      const { lineTotal } = computeLineTotals(row);
      return lineTotal <= 0 && parseCents(row.unitPrice) <= 0;
    });
    if (hasInvalidPrice) {
      setError("Every line item needs a valid price.");
      return;
    }

    setSubmitting(true);
    try {
      if (invoice) {
        await invoicesApi.update(
          invoice.id,
          {
            clientId,
            issueDate: issueDate || null,
            dueDate: dueDate || null,
            notes: notes || null,
            terms: terms || null,
            lineItems: rowsToLineItems(validItems)
          },
          invoice.version
        );
        router.push(`/invoices/${invoice.id}`);
      } else {
        const payload: CreateInvoiceInput = {
          clientId,
          lineItems: rowsToLineItems(validItems)
        };
        if (issueDate) payload.issueDate = issueDate;
        if (dueDate) payload.dueDate = dueDate;
        if (notes.trim()) payload.notes = notes.trim();
        if (terms.trim()) payload.terms = terms.trim();

        const result = await invoicesApi.create(payload);
        router.push(`/invoices/${result.invoice.id}`);
      }
    } catch (submitError) {
      setError(
        submitError instanceof ApiError ? submitError.message : "Failed to save the invoice."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      {error ? <FormAlert>{error}</FormAlert> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Client" htmlFor="invoice-client" required>
          <select
            id="invoice-client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            required
          >
            <option value="">Select a client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <div></div>

        <Field label="Issue date" htmlFor="invoice-issue-date">
          <Input
            id="invoice-issue-date"
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
          />
        </Field>

        <Field label="Due date" htmlFor="invoice-due-date">
          <Input
            id="invoice-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </Field>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Line Items</h3>
        <LineItemsEditor
          items={lineItems}
          products={products}
          currency="USD"
          onChange={setLineItems}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Notes" htmlFor="invoice-notes">
          <Textarea
            id="invoice-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Visible on the invoice"
          />
        </Field>

        <Field label="Terms" htmlFor="invoice-terms">
          <Textarea
            id="invoice-terms"
            rows={3}
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="Payment terms, late fees, etc."
          />
        </Field>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : invoice ? "Save changes" : "Create draft"}
        </Button>
      </div>
    </form>
  );
}
