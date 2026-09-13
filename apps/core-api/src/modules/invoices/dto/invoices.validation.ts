import { InvoiceStatus } from "@invocore/database";
import { AppError } from "@invocore/shared";

import type {
  CreateInvoiceRequestDto,
  CreateLineItemInput,
  ListInvoicesQuery,
  UpdateInvoiceRequestDto,
  UpdateLineItemInput
} from "./invoices.dto.js";

type UnknownRecord = Record<string, unknown>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

const MAX_LENGTHS = {
  notes: 2000,
  terms: 2000,
  description: 500,
  search: 200
} as const;

const MAX_UNIT_PRICE = 999_999_999;
const MAX_TAX_RATE = 10_000;
const MAX_QUANTITY = 999_999;
const MAX_LINE_ITEMS = 100;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const VALID_STATUSES = new Set(Object.values(InvoiceStatus));

function assertRecord(value: unknown): asserts value is UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError("Request body must be an object", "VALIDATION_ERROR", 422);
  }
}

function readRequiredString(body: UnknownRecord, key: string, maxLength: number): string {
  const value = body[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`${key} is required`, "VALIDATION_ERROR", 422);
  }

  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new AppError(`${key} must be at most ${maxLength} characters`, "VALIDATION_ERROR", 422);
  }

  return trimmed;
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
  if (trimmed.length > maxLength) {
    throw new AppError(`${key} must be at most ${maxLength} characters`, "VALIDATION_ERROR", 422);
  }
  return trimmed;
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
  if (trimmed.length > maxLength) {
    throw new AppError(`${key} must be at most ${maxLength} characters`, "VALIDATION_ERROR", 422);
  }
  return trimmed;
}

function readRequiredUuid(body: UnknownRecord, key: string): string {
  const value = body[key];
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new AppError(`${key} must be a valid UUID`, "VALIDATION_ERROR", 422);
  }
  return value;
}

function readOptionalUuid(body: UnknownRecord, key: string): string | undefined {
  const value = body[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new AppError(`${key} must be a valid UUID`, "VALIDATION_ERROR", 422);
  }
  return value;
}

function readNullableUuid(body: UnknownRecord, key: string): string | null | undefined {
  if (!(key in body)) {
    return undefined;
  }
  const value = body[key];
  if (value === null) {
    return null;
  }
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new AppError(`${key} must be a valid UUID or null`, "VALIDATION_ERROR", 422);
  }
  return value;
}

function readOptionalDate(body: UnknownRecord, key: string): string | undefined {
  const value = body[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
    throw new AppError(`${key} must be a date in YYYY-MM-DD format`, "VALIDATION_ERROR", 422);
  }
  if (Number.isNaN(new Date(value).getTime())) {
    throw new AppError(`${key} must be a valid date`, "VALIDATION_ERROR", 422);
  }
  return value;
}

function readNullableDate(body: UnknownRecord, key: string): string | null | undefined {
  if (!(key in body)) {
    return undefined;
  }
  const value = body[key];
  if (value === null) {
    return null;
  }
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
    throw new AppError(
      `${key} must be a date in YYYY-MM-DD format or null`,
      "VALIDATION_ERROR",
      422
    );
  }
  if (Number.isNaN(new Date(value).getTime())) {
    throw new AppError(`${key} must be a valid date`, "VALIDATION_ERROR", 422);
  }
  return value;
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

function parseLineItem(item: unknown, index: number): CreateLineItemInput {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw new AppError(`lineItems[${index}] must be an object`, "VALIDATION_ERROR", 422);
  }
  const record = item as UnknownRecord;

  return {
    productId: readOptionalUuid(record, "productId"),
    description: readRequiredString(record, "description", MAX_LENGTHS.description),
    quantity: readRequiredInteger(record, "quantity", 1, MAX_QUANTITY),
    unitPrice: readRequiredInteger(record, "unitPrice", 0, MAX_UNIT_PRICE),
    taxRate: readOptionalInteger(record, "taxRate", 0, MAX_TAX_RATE)
  };
}

function parseUpdateLineItem(item: unknown, index: number): UpdateLineItemInput {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw new AppError(`lineItems[${index}] must be an object`, "VALIDATION_ERROR", 422);
  }
  const record = item as UnknownRecord;

  return {
    id: readOptionalUuid(record, "id"),
    productId: readNullableUuid(record, "productId") ?? undefined,
    description: readRequiredString(record, "description", MAX_LENGTHS.description),
    quantity: readRequiredInteger(record, "quantity", 1, MAX_QUANTITY),
    unitPrice: readRequiredInteger(record, "unitPrice", 0, MAX_UNIT_PRICE),
    taxRate: readOptionalInteger(record, "taxRate", 0, MAX_TAX_RATE)
  };
}

export function parseInvoiceId(value: unknown): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new AppError("A valid invoice id is required", "VALIDATION_ERROR", 422);
  }
  return value;
}

export function parseCreateInvoiceRequest(body: unknown): CreateInvoiceRequestDto {
  assertRecord(body);

  const lineItemsRaw = body.lineItems;
  if (!Array.isArray(lineItemsRaw) || lineItemsRaw.length === 0) {
    throw new AppError("At least one line item is required", "VALIDATION_ERROR", 422);
  }
  if (lineItemsRaw.length > MAX_LINE_ITEMS) {
    throw new AppError(`At most ${MAX_LINE_ITEMS} line items are allowed`, "VALIDATION_ERROR", 422);
  }

  const currency = readOptionalString(body, "currency", 3);
  if (currency !== undefined && !CURRENCY_PATTERN.test(currency)) {
    throw new AppError("currency must be a 3-letter ISO code (e.g. USD)", "VALIDATION_ERROR", 422);
  }

  return {
    clientId: readRequiredUuid(body, "clientId"),
    issueDate: readOptionalDate(body, "issueDate"),
    dueDate: readOptionalDate(body, "dueDate"),
    currency,
    notes: readOptionalString(body, "notes", MAX_LENGTHS.notes),
    terms: readOptionalString(body, "terms", MAX_LENGTHS.terms),
    lineItems: lineItemsRaw.map((item, index) => parseLineItem(item, index))
  };
}

export function parseUpdateInvoiceRequest(body: unknown): UpdateInvoiceRequestDto {
  assertRecord(body);

  const dto: UpdateInvoiceRequestDto = {};

  if ("clientId" in body) {
    dto.clientId = readRequiredUuid(body, "clientId");
  }

  const issueDate = readNullableDate(body, "issueDate");
  if (issueDate !== undefined) {
    dto.issueDate = issueDate;
  }

  const dueDate = readNullableDate(body, "dueDate");
  if (dueDate !== undefined) {
    dto.dueDate = dueDate;
  }

  const notes = readNullableString(body, "notes", MAX_LENGTHS.notes);
  if (notes !== undefined) {
    dto.notes = notes;
  }

  const terms = readNullableString(body, "terms", MAX_LENGTHS.terms);
  if (terms !== undefined) {
    dto.terms = terms;
  }

  if ("lineItems" in body) {
    const lineItemsRaw = body.lineItems;
    if (!Array.isArray(lineItemsRaw) || lineItemsRaw.length === 0) {
      throw new AppError("At least one line item is required", "VALIDATION_ERROR", 422);
    }
    if (lineItemsRaw.length > MAX_LINE_ITEMS) {
      throw new AppError(
        `At most ${MAX_LINE_ITEMS} line items are allowed`,
        "VALIDATION_ERROR",
        422
      );
    }
    dto.lineItems = lineItemsRaw.map((item, index) => parseUpdateLineItem(item, index));
  }

  if (Object.keys(dto).length === 0) {
    throw new AppError("At least one field is required", "VALIDATION_ERROR", 422);
  }

  return dto;
}

export function parseListInvoicesQuery(query: unknown): ListInvoicesQuery {
  const record: UnknownRecord =
    query && typeof query === "object" && !Array.isArray(query) ? (query as UnknownRecord) : {};

  const statusRaw = record.status;
  let status: string | undefined;
  if (typeof statusRaw === "string" && VALID_STATUSES.has(statusRaw as InvoiceStatus)) {
    status = statusRaw;
  }

  const clientIdRaw = record.clientId;
  let clientId: string | undefined;
  if (typeof clientIdRaw === "string" && UUID_PATTERN.test(clientIdRaw)) {
    clientId = clientIdRaw;
  }

  return {
    limit: readBoundedInteger(record, "limit", DEFAULT_LIMIT, 1, MAX_LIMIT),
    offset: readBoundedInteger(record, "offset", 0, 0, Number.MAX_SAFE_INTEGER),
    search: readOptionalString(record, "search", MAX_LENGTHS.search),
    status,
    clientId
  };
}

export function parseVersionHeader(value: unknown): number {
  const num = typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isInteger(num) || num < 1) {
    throw new AppError(
      "X-Expected-Version header is required and must be a positive integer",
      "VALIDATION_ERROR",
      422
    );
  }
  return num;
}
