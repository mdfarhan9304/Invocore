import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";

import { asyncController } from "../../common/http/async-controller.js";
import { getTenantContext } from "../../common/http/context.js";
import type { MembershipsService } from "../memberships/memberships.service.js";
import { createRoleGuard } from "../memberships/role.guard.js";

export function createOrganizationsController(membershipsService: MembershipsService): Router {
  const router = createRouter();

  router.get(
    "/current/members",
    createRoleGuard("ADMIN"),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      const members = await membershipsService.listOrganizationMembers(tenant.organizationId);

      response.status(200).json({ members });
    })
  );

  return router;
}
