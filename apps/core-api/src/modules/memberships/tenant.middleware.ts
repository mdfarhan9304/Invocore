import { AppError } from "@invocore/shared";
import type { NextFunction, Request, RequestHandler, Response } from "express";

import { getAuthContext, setTenantContext } from "../../common/http/context.js";
import type { UsersRepository } from "../users/users.repository.js";
import type { MembershipsRepository } from "./memberships.repository.js";

const ORGANIZATION_HEADER = "x-organization-id";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type TenantMiddlewareDependencies = {
  membershipsRepository: MembershipsRepository;
  usersRepository: UsersRepository;
};

async function resolveTenant(
  request: Request,
  dependencies: TenantMiddlewareDependencies
): Promise<void> {
  const { membershipsRepository, usersRepository } = dependencies;
  const auth = getAuthContext(request);

  const emailVerified = await usersRepository.isEmailVerified(auth.userId);
  if (!emailVerified) {
    throw new AppError("Verify your email before using this workspace", "EMAIL_NOT_VERIFIED", 403);
  }

  const rawHeader = request.headers[ORGANIZATION_HEADER];
  const organizationId = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  if (!organizationId || !UUID_PATTERN.test(organizationId)) {
    throw new AppError(
      "A valid X-Organization-Id header is required",
      "TENANT_CONTEXT_REQUIRED",
      400
    );
  }

  const membership = await membershipsRepository.findByOrganizationAndUser({
    organizationId,
    userId: auth.userId
  });
  if (!membership) {
    throw new AppError("You do not have access to this organization", "TENANT_ACCESS_DENIED", 403);
  }

  setTenantContext(request, {
    organizationId,
    role: membership.role
  });
}

export function createTenantMiddleware(dependencies: TenantMiddlewareDependencies): RequestHandler {
  return (request: Request, _response: Response, next: NextFunction) => {
    resolveTenant(request, dependencies).then(() => next(), next);
  };
}
