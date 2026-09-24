import { prisma, type PrismaClient } from "@invocore/database";
import express, { type Router } from "express";

import { createAuthGuard } from "../auth/guards/auth.guard.js";
import { createMembershipsRepository } from "../memberships/memberships.repository.js";
import { createTenantMiddleware } from "../memberships/tenant.middleware.js";
import { createDashboardController } from "./dashboard.controller.js";
import { DashboardRepository } from "./dashboard.repository.js";
import { DashboardService } from "./dashboard.service.js";

export function createDashboardModule(client: PrismaClient = prisma): Router {
  const router = express.Router();
  const membershipsRepository = createMembershipsRepository(client);
  const dashboardService = new DashboardService(new DashboardRepository(client));

  router.use(createAuthGuard(), createTenantMiddleware({ membershipsRepository }));
  router.use(createDashboardController(dashboardService));
  return router;
}
