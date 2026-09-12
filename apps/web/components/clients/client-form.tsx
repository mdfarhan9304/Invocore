"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormAlert } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { clientsApi } from "@/lib/api/clients";
import type { Client, CreateClientInput, UpdateClientInput } from "@/lib/api/types";

type FormValues = {
  name: string;
  email: string;
  phone: string;
  taxId: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes: string;
};

type OptionalKey = Exclude<keyof FormValues, "name">;

const OPTIONAL_FIELDS: Array<{
  key: OptionalKey;
  label: string;
  type?: string;
  full?: boolean;
  textarea?: boolean;
}> = [
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone" },
  { key: "taxId", label: "Tax ID" },
  { key: "addressLine1", label: "Address line 1", full: true },
  { key: "addressLine2", label: "Address line 2", full: true },
  { key: "city", label: "City" },
  { key: "state", label: "State / Province" },
  { key: "postalCode", label: "Postal code" },
  { key: "country", label: "Country" },
  { key: "notes", label: "Notes", full: true, textarea: true }
];

function toInitialValues(client: Client | null): FormValues {
  return {
    name: client?.name ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    taxId: client?.taxId ?? "",
    addressLine1: client?.addressLine1 ?? "",
    addressLine2: client?.addressLine2 ?? "",
    city: client?.city ?? "",
    state: client?.state ?? "",
    postalCode: client?.postalCode ?? "",
    country: client?.country ?? "",
    notes: client?.notes ?? ""
  };
}

function toCreatePayload(values: FormValues): CreateClientInput {
  const payload: CreateClientInput = { name: values.name.trim() };
  for (const { key } of OPTIONAL_FIELDS) {
    const value = values[key].trim();
    if (value) {
      payload[key] = value;
    }
  }
  return payload;
}

function toUpdatePayload(values: FormValues): UpdateClientInput {
  const payload: UpdateClientInput = { name: values.name.trim() };
  for (const { key } of OPTIONAL_FIELDS) {
    const value = values[key].trim();
    payload[key] = value ? value : null;
  }
  return payload;
}

type ClientFormProps = {
  client: Client | null;
  onSuccess: () => void;
  onCancel: () => void;
};

export function ClientForm({ client, onSuccess, onCancel }: ClientFormProps) {
  const [values, setValues] = useState<FormValues>(() => toInitialValues(client));
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField(key: keyof FormValues, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNameError(null);

    if (!values.name.trim()) {
      setNameError("Name is required.");
      return;
    }

    setSubmitting(true);
    try {
      if (client) {
        await clientsApi.update(client.id, toUpdatePayload(values));
      } else {
        await clientsApi.create(toCreatePayload(values));
      }
      onSuccess();
    } catch (submitError) {
      setError(
        submitError instanceof ApiError ? submitError.message : "Failed to save the client."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {error ? <FormAlert>{error}</FormAlert> : null}

      <Field label="Name" htmlFor="client-name" required error={nameError ?? undefined}>
        <Input
          id="client-name"
          value={values.name}
          onChange={(event) => updateField("name", event.target.value)}
          maxLength={200}
          required
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {OPTIONAL_FIELDS.map((fieldConfig) => (
          <div key={fieldConfig.key} className={fieldConfig.full ? "sm:col-span-2" : undefined}>
            <Field label={fieldConfig.label} htmlFor={`client-${fieldConfig.key}`}>
              {fieldConfig.textarea ? (
                <Textarea
                  id={`client-${fieldConfig.key}`}
                  rows={3}
                  value={values[fieldConfig.key]}
                  onChange={(event) => updateField(fieldConfig.key, event.target.value)}
                />
              ) : (
                <Input
                  id={`client-${fieldConfig.key}`}
                  type={fieldConfig.type ?? "text"}
                  value={values[fieldConfig.key]}
                  onChange={(event) => updateField(fieldConfig.key, event.target.value)}
                />
              )}
            </Field>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : client ? "Save changes" : "Create client"}
        </Button>
      </div>
    </form>
  );
}
