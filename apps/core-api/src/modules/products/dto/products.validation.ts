import { AppError } from "@invocore/shared";

import type {
  CreateProductRequestDto,
  ListProductsQuery,
  UpdateProductRequestDto
} from "./products.dto.js";

type UnknownRecord = Record<string, unknown>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

const MAX_LENGTHS = {
  name: 200,
  description: 2000
} as const;

const MAX_UNIT_PRICE = 999_999_999;
const MAX_TAX_RATE = 10_000;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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

function readRequiredInteger(body: UnknownRecord, key: string, min: number, max: number): number {
  const raw = body[key];
  if (raw === undefined || raw === null) {
    throw new AppError(`${key} is required`, "VALIDATION_ERROR", 422);
  }

  const value = typeof raw === "number" ? raw : Number.NaN;
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new AppError(
      `${key} must be an integer between ${min} and ${max}`,
      "VALIDATION_ERROR",
      422
    );
  }

  return value;
}

function readOptionalInteger(
  body: UnknownRecord,
  key: string,
  min: number,
  max: number
): number | undefined {
  const raw = body[key];
  if (raw === undefined || raw === null) {
    return undefined;
  }

  const value = typeof raw === "number" ? raw : Number.NaN;
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new AppError(
      `${key} must be an integer between ${min} and ${max}`,
      "VALIDATION_ERROR",
      422
    );
  }

  return value;
}

function readOptionalBoolean(body: UnknownRecord, key: string): boolean | undefined {
  const value = body[key];
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new AppError(`${key} must be a boolean`, "VALIDATION_ERROR", 422);
  }

  return value;
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

function readOptionalCurrency(body: UnknownRecord): string | undefined {
  const value = body.currency;
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string" || !CURRENCY_PATTERN.test(value)) {
    throw new AppError("currency must be a 3-letter ISO code (e.g. USD)", "VALIDATION_ERROR", 422);
  }

  return value;
}

export function parseProductId(value: unknown): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new AppError("A valid product id is required", "VALIDATION_ERROR", 422);
  }

  return value;
}

export function parseCreateProductRequest(body: unknown): CreateProductRequestDto {
  assertRecord(body);

  return {
    name: readRequiredString(body, "name", MAX_LENGTHS.name),
    description: readOptionalString(body, "description", MAX_LENGTHS.description),
    unitPrice: readRequiredInteger(body, "unitPrice", 0, MAX_UNIT_PRICE),
    currency: readOptionalCurrency(body),
    taxRate: readOptionalInteger(body, "taxRate", 0, MAX_TAX_RATE)
  };
}

export function parseUpdateProductRequest(body: unknown): UpdateProductRequestDto {
  assertRecord(body);

  const dto: UpdateProductRequestDto = {};

  if ("name" in body) {
    dto.name = readRequiredString(body, "name", MAX_LENGTHS.name);
  }

  const description = readNullableString(body, "description", MAX_LENGTHS.description);
  if (description !== undefined) {
    dto.description = description;
  }

  const unitPrice = readOptionalInteger(body, "unitPrice", 0, MAX_UNIT_PRICE);
  if (unitPrice !== undefined) {
    dto.unitPrice = unitPrice;
  }

  const currency = readOptionalCurrency(body);
  if (currency !== undefined) {
    dto.currency = currency;
  }

  const taxRate = readOptionalInteger(body, "taxRate", 0, MAX_TAX_RATE);
  if (taxRate !== undefined) {
    dto.taxRate = taxRate;
  }

  const isActive = readOptionalBoolean(body, "isActive");
  if (isActive !== undefined) {
    dto.isActive = isActive;
  }

  if (Object.keys(dto).length === 0) {
    throw new AppError("At least one field is required", "VALIDATION_ERROR", 422);
  }

  return dto;
}

export function parseListProductsQuery(query: unknown): ListProductsQuery {
  const record: UnknownRecord =
    query && typeof query === "object" && !Array.isArray(query) ? (query as UnknownRecord) : {};

  const activeRaw = record.active;
  let active: boolean | undefined;
  if (activeRaw === "true") {
    active = true;
  } else if (activeRaw === "false") {
    active = false;
  }

  return {
    limit: readBoundedInteger(record, "limit", DEFAULT_LIMIT, 1, MAX_LIMIT),
    offset: readBoundedInteger(record, "offset", 0, 0, Number.MAX_SAFE_INTEGER),
    search: readOptionalString(record, "search", MAX_LENGTHS.name),
    active
  };
}
