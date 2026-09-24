import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";

import { asyncController } from "../../common/http/async-controller.js";
import { getTenantContext } from "../../common/http/context.js";
import { createPermissionGuard } from "../memberships/role.guard.js";
import type { DashboardService } from "./dashboard.service.js";

export function createDashboardController(dashboardService: DashboardService): Router {
  const router = createRouter();

  router.get(
    "/summary",
    createPermissionGuard("invoices:read"),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      const summary = await dashboardService.getSummary(tenant.organizationId);
      response.status(200).json({ summary });
    })
  );

  return router;
}
