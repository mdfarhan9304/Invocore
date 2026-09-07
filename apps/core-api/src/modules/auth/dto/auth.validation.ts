import { AppError } from "@invocore/shared";

import type { LoginRequestDto, RegisterRequestDto } from "./auth.dto.js";

type UnknownRecord = Record<string, unknown>;

function assertRecord(value: unknown): asserts value is UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError("Request body must be an object", "VALIDATION_ERROR", 422);
  }
}

function readString(body: UnknownRecord, key: string): string {
  const value = body[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`${key} is required`, "VALIDATION_ERROR", 422);
  }

  return value.trim();
}

function normalizeEmail(email: string): string {
  const normalized = email.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new AppError("email must be valid", "VALIDATION_ERROR", 422);
  }

  return normalized;
}

function readPassword(body: UnknownRecord): string {
  const password = readString(body, "password");
  if (password.length < 8) {
    throw new AppError("password must be at least 8 characters", "VALIDATION_ERROR", 422);
  }

  return password;
}

export function parseRegisterRequest(body: unknown): RegisterRequestDto {
  assertRecord(body);

  const organizationName = body.organizationName;

  return {
    email: normalizeEmail(readString(body, "email")),
    name: readString(body, "name"),
    organizationName:
      typeof organizationName === "string" && organizationName.trim().length > 0
        ? organizationName.trim()
        : undefined,
    password: readPassword(body)
  };
}

export function parseLoginRequest(body: unknown): LoginRequestDto {
  assertRecord(body);

  return {
    email: normalizeEmail(readString(body, "email")),
    password: readString(body, "password")
  };
}
