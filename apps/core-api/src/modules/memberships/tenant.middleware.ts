import { AppError } from "@invocore/shared";
import type { NextFunction, Request, RequestHandler, Response } from "express";

import { getAuthContext, setTenantContext } from "../../common/http/context.js";
import type { MembershipsRepository } from "./memberships.repository.js";

const ORGANIZATION_HEADER = "x-organization-id";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type TenantMiddlewareDependencies = {
  membershipsRepository: MembershipsRepository;
};

async function resolveTenant(
  request: Request,
  membershipsRepository: MembershipsRepository
): Promise<void> {
  const auth = getAuthContext(request);

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
  const { membershipsRepository } = dependencies;

  return (request: Request, _response: Response, next: NextFunction) => {
    resolveTenant(request, membershipsRepository).then(() => next(), next);
  };
}
