import type { PrismaClient } from "@invocore/database";
import { prisma } from "@invocore/database";
import type { Router } from "express";
import { Router as createRouter } from "express";

import { createAuthGuard } from "../auth/guards/auth.guard.js";
import { createMembershipsRepository } from "../memberships/memberships.repository.js";
import { createMembershipsService } from "../memberships/memberships.service.js";
import { createTenantMiddleware } from "../memberships/tenant.middleware.js";
import { createOrganizationsController } from "./organizations.controller.js";

export function createOrganizationsModule(client: PrismaClient = prisma): Router {
  const router = createRouter();
  const membershipsRepository = createMembershipsRepository(client);
  const membershipsService = createMembershipsService(membershipsRepository);

  router.use(createAuthGuard(), createTenantMiddleware({ membershipsRepository }));
  router.use(createOrganizationsController(membershipsService));

  return router;
}
