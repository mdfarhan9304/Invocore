import { AppError } from "@invocore/shared";

import type {
  CreateClientRequestDto,
  ListClientsQuery,
  UpdateClientRequestDto
} from "./clients.dto.js";

type UnknownRecord = Record<string, unknown>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_LENGTHS = {
  name: 200,
  email: 320,
  phone: 50,
  taxId: 50,
  addressLine1: 200,
  addressLine2: 200,
  city: 100,
  state: 100,
  postalCode: 20,
  country: 100,
  notes: 2000
} as const;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const NULLABLE_TEXT_FIELDS = [
  "phone",
  "taxId",
  "addressLine1",
  "addressLine2",
  "city",
  "state",
  "postalCode",
  "country",
  "notes"
] as const;

type NullableTextField = (typeof NULLABLE_TEXT_FIELDS)[number];

function assertRecord(value: unknown): asserts value is UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError("Request body must be an object", "VALIDATION_ERROR", 422);
  }
}

function assertMaxLength(key: string, value: string, maxLength: number): string {
  if (value.length > maxLength) {
    throw new AppError(`${key} must be at most ${maxLength} characters`, "VALIDATION_ERROR", 422);
  }

  return value;
}

function readRequiredString(body: UnknownRecord, key: string, maxLength: number): string {
  const value = body[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`${key} is required`, "VALIDATION_ERROR", 422);
  }

  return assertMaxLength(key, value.trim(), maxLength);
}

function readOptionalString(
  body: UnknownRecord,
  key: string,
  maxLength: number
): string | undefined {
  const value = body[key];
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new AppError(`${key} must be a string`, "VALIDATION_ERROR", 422);
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  return assertMaxLength(key, trimmed, maxLength);
}

function readNullableString(
  body: UnknownRecord,
  key: string,
  maxLength: number
): string | null | undefined {
  if (!(key in body)) {
    return undefined;
  }

  const value = body[key];
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new AppError(`${key} must be a string or null`, "VALIDATION_ERROR", 422);
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  return assertMaxLength(key, trimmed, maxLength);
}

function normalizeEmail(email: string): string {
  const normalized = email.toLowerCase();
  if (!EMAIL_PATTERN.test(normalized)) {
    throw new AppError("email must be valid", "VALIDATION_ERROR", 422);
  }

  return normalized;
}

function readBoundedInteger(
  record: UnknownRecord,
  key: string,
  fallback: number,
  min: number,
  max: number
): number {
  const raw = record[key];
  if (raw === undefined || raw === "") {
    return fallback;
  }

  const value = typeof raw === "string" || typeof raw === "number" ? Number(raw) : Number.NaN;
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new AppError(
      `${key} must be an integer between ${min} and ${max}`,
      "VALIDATION_ERROR",
      422
    );
  }

  return value;
}

export function parseClientId(value: unknown): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new AppError("A valid client id is required", "VALIDATION_ERROR", 422);
  }

  return value;
}

export function parseCreateClientRequest(body: unknown): CreateClientRequestDto {
  assertRecord(body);

  const email = readOptionalString(body, "email", MAX_LENGTHS.email);

  return {
    name: readRequiredString(body, "name", MAX_LENGTHS.name),
    email: email === undefined ? undefined : normalizeEmail(email),
    phone: readOptionalString(body, "phone", MAX_LENGTHS.phone),
    taxId: readOptionalString(body, "taxId", MAX_LENGTHS.taxId),
    addressLine1: readOptionalString(body, "addressLine1", MAX_LENGTHS.addressLine1),
    addressLine2: readOptionalString(body, "addressLine2", MAX_LENGTHS.addressLine2),
    city: readOptionalString(body, "city", MAX_LENGTHS.city),
    state: readOptionalString(body, "state", MAX_LENGTHS.state),
    postalCode: readOptionalString(body, "postalCode", MAX_LENGTHS.postalCode),
    country: readOptionalString(body, "country", MAX_LENGTHS.country),
    notes: readOptionalString(body, "notes", MAX_LENGTHS.notes)
  };
}

export function parseUpdateClientRequest(body: unknown): UpdateClientRequestDto {
  assertRecord(body);

  const dto: UpdateClientRequestDto = {};

  if ("name" in body) {
    dto.name = readRequiredString(body, "name", MAX_LENGTHS.name);
  }

  const email = readNullableString(body, "email", MAX_LENGTHS.email);
  if (email !== undefined) {
    dto.email = email === null ? null : normalizeEmail(email);
  }

  for (const field of NULLABLE_TEXT_FIELDS) {
    const value = readNullableString(body, field, MAX_LENGTHS[field as NullableTextField]);
    if (value !== undefined) {
      dto[field] = value;
    }
  }

  if (Object.keys(dto).length === 0) {
    throw new AppError("At least one field is required", "VALIDATION_ERROR", 422);
  }

  return dto;
}

export function parseListClientsQuery(query: unknown): ListClientsQuery {
  const record: UnknownRecord =
    query && typeof query === "object" && !Array.isArray(query) ? (query as UnknownRecord) : {};

  return {
    limit: readBoundedInteger(record, "limit", DEFAULT_LIMIT, 1, MAX_LIMIT),
    offset: readBoundedInteger(record, "offset", 0, 0, Number.MAX_SAFE_INTEGER),
    search: readOptionalString(record, "search", MAX_LENGTHS.name)
  };
}
