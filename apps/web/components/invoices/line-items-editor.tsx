"use client";

import { PlusIcon, TrashIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";

export type LineItemRow = {
  key: string;
  productId: string;
  description: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
};

function emptyRow(): LineItemRow {
  return {
    key: crypto.randomUUID(),
    productId: "",
    description: "",
    quantity: "1",
    unitPrice: "",
    taxRate: "0"
  };
}

function parseCents(value: string): number {
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) return 0;
  return Math.round(num * 100);
}

function parseQty(value: string): number {
  const num = Number(value);
  if (Number.isNaN(num) || num < 1) return 0;
  return Math.floor(num);
}

function parseBasisPoints(value: string): number {
  const num = Number(value);
  if (Number.isNaN(num) || num < 0 || num > 100) return 0;
  return Math.round(num * 100);
}

export function computeLineTotals(row: LineItemRow): { lineTotal: number; lineTax: number } {
  const qty = parseQty(row.quantity);
  const price = parseCents(row.unitPrice);
  const taxBp = parseBasisPoints(row.taxRate);
  const lineTotal = qty * price;
  const lineTax = Math.round((lineTotal * taxBp) / 10_000);
  return { lineTotal, lineTax };
}

export function computeInvoiceTotals(rows: LineItemRow[]): {
  subtotal: number;
  taxTotal: number;
  total: number;
} {
  let subtotal = 0;
  let taxTotal = 0;
  for (const row of rows) {
    const { lineTotal, lineTax } = computeLineTotals(row);
    subtotal += lineTotal;
    taxTotal += lineTax;
  }
  return { subtotal, taxTotal, total: subtotal + taxTotal };
}

type LineItemsEditorProps = {
  items: LineItemRow[];
  products: Product[];
  currency: string;
  onChange: (items: LineItemRow[]) => void;
};

export function LineItemsEditor({ items, products, currency, onChange }: LineItemsEditorProps) {
  function addRow() {
    onChange([...items, emptyRow()]);
  }

  function removeRow(index: number) {
    if (items.length <= 1) return;
    onChange(items.filter((_, i) => i !== index));
  }

  function updateRow(index: number, field: keyof LineItemRow, value: string) {
    const updated = items.map((item, i) => (i === index ? { ...item, [field]: value } : item));

    if (field === "productId" && value) {
      const product = products.find((p) => p.id === value);
      if (product) {
        updated[index] = {
          ...updated[index]!,
          productId: value,
          description: product.name,
          unitPrice: (product.unitPrice / 100).toFixed(2),
          taxRate: (product.taxRate / 100).toFixed(2)
        };
      }
    }

    onChange(updated);
  }

  const totals = computeInvoiceTotals(items);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 pr-2 font-medium">Product</th>
              <th className="pb-2 pr-2 font-medium">Description</th>
              <th className="pb-2 pr-2 font-medium w-20">Qty</th>
              <th className="pb-2 pr-2 font-medium w-28">Price</th>
              <th className="pb-2 pr-2 font-medium w-20">Tax %</th>
              <th className="pb-2 pr-2 font-medium w-28 text-right">Total</th>
              <th className="pb-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const { lineTotal, lineTax } = computeLineTotals(item);
              return (
                <tr key={item.key} className="border-b">
                  <td className="py-2 pr-2">
                    <select
                      value={item.productId}
                      onChange={(e) => updateRow(index, "productId", e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
                    >
                      <option value="">Custom item</option>
                      {products
                        .filter((p) => p.isActive)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="py-2 pr-2">
                    <Input
                      value={item.description}
                      onChange={(e) => updateRow(index, "description", e.target.value)}
                      placeholder="Line item description"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateRow(index, "quantity", e.target.value)}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={item.unitPrice}
                      onChange={(e) => updateRow(index, "unitPrice", e.target.value)}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={item.taxRate}
                      onChange={(e) => updateRow(index, "taxRate", e.target.value)}
                    />
                  </td>
                  <td className="py-2 pr-2 text-right whitespace-nowrap font-medium">
                    {formatCurrency(lineTotal + lineTax, currency)}
                  </td>
                  <td className="py-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRow(index)}
                      disabled={items.length <= 1}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Button type="button" variant="secondary" size="sm" onClick={addRow}>
        <PlusIcon className="h-4 w-4" />
        Add line item
      </Button>

      <div className="flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(totals.subtotal, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatCurrency(totals.taxTotal, currency)}</span>
          </div>
          <div className="flex justify-between border-t pt-1 font-semibold">
            <span>Total</span>
            <span>{formatCurrency(totals.total, currency)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export { emptyRow };
