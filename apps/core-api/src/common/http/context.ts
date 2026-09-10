import type { Role } from "@invocore/database";
import { AppError } from "@invocore/shared";
import type { Request } from "express";

export type AuthContext = {
  email: string;
  userId: string;
};

export type TenantContext = {
  organizationId: string;
  role: Role;
};

export function setAuthContext(request: Request, context: AuthContext): void {
  request.auth = context;
}

export function getAuthContext(request: Request): AuthContext {
  if (!request.auth) {
    throw new AppError("Authentication required", "UNAUTHORIZED", 401);
  }

  return request.auth;
}

export function setTenantContext(request: Request, context: TenantContext): void {
  request.tenant = context;
}

export function getTenantContext(request: Request): TenantContext {
  if (!request.tenant) {
    throw new AppError("Organization context required", "TENANT_CONTEXT_REQUIRED", 400);
  }

  return request.tenant;
}
