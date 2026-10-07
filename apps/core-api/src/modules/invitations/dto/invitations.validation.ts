import { AppError } from "@invocore/shared";

import type {
  CreateInvitationRequestDto,
  InvitationRole,
  ListInvitationsQuery
} from "./invitations.dto.js";

type UnknownRecord = Record<string, unknown>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const INVITABLE_ROLES = new Set<InvitationRole>(["ADMIN", "ACCOUNTANT", "VIEWER"]);
const MAX_EMAIL_LENGTH = 320;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function assertRecord(value: unknown): asserts value is UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError("Request body must be an object", "VALIDATION_ERROR", 422);
  }
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

export function parseInvitationId(value: unknown): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new AppError("A valid invitation id is required", "VALIDATION_ERROR", 422);
  }

  return value;
}

export function parseCreateInvitationRequest(body: unknown): CreateInvitationRequestDto {
  assertRecord(body);

  const rawEmail = body.email;
  if (typeof rawEmail !== "string") {
    throw new AppError("email is required", "VALIDATION_ERROR", 422);
  }

  const email = rawEmail.trim().toLowerCase();
  if (email.length === 0 || email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    throw new AppError("email must be valid", "VALIDATION_ERROR", 422);
  }

  if (typeof body.role !== "string" || !INVITABLE_ROLES.has(body.role as InvitationRole)) {
    throw new AppError("role must be ADMIN, ACCOUNTANT, or VIEWER", "VALIDATION_ERROR", 422);
  }

  return { email, role: body.role as InvitationRole };
}

export function parseListInvitationsQuery(query: unknown): ListInvitationsQuery {
  const record: UnknownRecord =
    query && typeof query === "object" && !Array.isArray(query) ? (query as UnknownRecord) : {};

  return {
    limit: readBoundedInteger(record, "limit", DEFAULT_LIMIT, 1, MAX_LIMIT),
    offset: readBoundedInteger(record, "offset", 0, 0, Number.MAX_SAFE_INTEGER)
  };
}
