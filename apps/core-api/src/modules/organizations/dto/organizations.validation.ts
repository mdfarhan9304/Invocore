import { AppError } from "@invocore/shared";

type UnknownRecord = Record<string, unknown>;

function assertRecord(value: unknown): asserts value is UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError("Request body must be an object", "VALIDATION_ERROR", 422);
  }
}

export type CreateOrganizationRequestDto = {
  name: string;
};

export function parseCreateOrganizationRequest(body: unknown): CreateOrganizationRequestDto {
  assertRecord(body);

  const name = body.name;
  if (typeof name !== "string" || name.trim().length === 0) {
    throw new AppError("name is required", "VALIDATION_ERROR", 422);
  }

  if (name.trim().length > 120) {
    throw new AppError("name must be 120 characters or fewer", "VALIDATION_ERROR", 422);
  }

  return { name: name.trim() };
}
