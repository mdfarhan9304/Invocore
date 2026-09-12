import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";

import { asyncController } from "../../common/http/async-controller.js";
import { getAuthContext, getTenantContext } from "../../common/http/context.js";
import type { MembershipsService } from "../memberships/memberships.service.js";
import { createPermissionGuard } from "../memberships/role.guard.js";

export function createUserOrganizationsController(membershipsService: MembershipsService): Router {
  const router = createRouter();

  router.get(
    "/",
    asyncController(async (request: Request, response: Response) => {
      const auth = getAuthContext(request);
      const organizations = await membershipsService.listUserOrganizations(auth.userId);

      response.status(200).json({ organizations });
    })
  );

  return router;
}

export function createOrganizationsController(membershipsService: MembershipsService): Router {
  const router = createRouter();

  router.get(
    "/current/members",
    createPermissionGuard("members:read"),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      const members = await membershipsService.listOrganizationMembers(tenant.organizationId);

      response.status(200).json({ members });
    })
  );

  return router;
}
