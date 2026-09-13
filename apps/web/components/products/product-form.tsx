"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormAlert } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { productsApi } from "@/lib/api/products";
import type { CreateProductInput, Product, UpdateProductInput } from "@/lib/api/types";

type FormValues = {
  name: string;
  description: string;
  unitPrice: string;
  currency: string;
  taxRate: string;
};

function toInitialValues(product: Product | null): FormValues {
  return {
    name: product?.name ?? "",
    description: product?.description ?? "",
    unitPrice: product ? (product.unitPrice / 100).toFixed(2) : "",
    currency: product?.currency ?? "USD",
    taxRate: product ? (product.taxRate / 100).toFixed(2) : ""
  };
}

function parseCents(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const num = Number(trimmed);
  if (Number.isNaN(num) || num < 0) {
    return null;
  }

  return Math.round(num * 100);
}

function parseBasisPoints(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const num = Number(trimmed);
  if (Number.isNaN(num) || num < 0 || num > 100) {
    return null;
  }

  return Math.round(num * 100);
}

type ProductFormProps = {
  product: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
};

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const [values, setValues] = useState<FormValues>(() => toInitialValues(product));
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField(key: keyof FormValues, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormValues, string>> = {};

    if (!values.name.trim()) {
      next.name = "Name is required.";
    }

    const cents = parseCents(values.unitPrice);
    if (cents === null) {
      next.unitPrice = "Enter a valid price (e.g. 50.00).";
    }

    const taxBp = parseBasisPoints(values.taxRate);
    if (values.taxRate.trim() && taxBp === null) {
      next.taxRate = "Enter a valid percentage (0–100).";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      if (product) {
        const payload: UpdateProductInput = {
          name: values.name.trim(),
          description: values.description.trim() || null,
          unitPrice: parseCents(values.unitPrice)!,
          currency: values.currency.trim().toUpperCase() || "USD",
          taxRate: parseBasisPoints(values.taxRate) ?? 0
        };
        await productsApi.update(product.id, payload);
      } else {
        const payload: CreateProductInput = {
          name: values.name.trim(),
          unitPrice: parseCents(values.unitPrice)!
        };
        const desc = values.description.trim();
        if (desc) {
          payload.description = desc;
        }
        const cur = values.currency.trim().toUpperCase();
        if (cur && cur !== "USD") {
          payload.currency = cur;
        }
        const tax = parseBasisPoints(values.taxRate);
        if (tax && tax > 0) {
          payload.taxRate = tax;
        }
        await productsApi.create(payload);
      }
      onSuccess();
    } catch (submitError) {
      setError(
        submitError instanceof ApiError ? submitError.message : "Failed to save the product."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {error ? <FormAlert>{error}</FormAlert> : null}

      <Field label="Name" htmlFor="product-name" required error={errors.name}>
        <Input
          id="product-name"
          value={values.name}
          onChange={(event) => updateField("name", event.target.value)}
          maxLength={200}
          required
        />
      </Field>

      <Field label="Description" htmlFor="product-description">
        <Textarea
          id="product-description"
          rows={2}
          value={values.description}
          onChange={(event) => updateField("description", event.target.value)}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Unit price" htmlFor="product-price" required error={errors.unitPrice}>
          <Input
            id="product-price"
            type="text"
            inputMode="decimal"
            placeholder="50.00"
            value={values.unitPrice}
            onChange={(event) => updateField("unitPrice", event.target.value)}
          />
        </Field>

        <Field label="Currency" htmlFor="product-currency">
          <Input
            id="product-currency"
            value={values.currency}
            onChange={(event) => updateField("currency", event.target.value)}
            maxLength={3}
            placeholder="USD"
          />
        </Field>

        <Field label="Tax rate (%)" htmlFor="product-tax" error={errors.taxRate}>
          <Input
            id="product-tax"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={values.taxRate}
            onChange={(event) => updateField("taxRate", event.target.value)}
          />
        </Field>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : product ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
