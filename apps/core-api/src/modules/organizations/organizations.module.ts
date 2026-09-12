import type { PrismaClient } from "@invocore/database";
import { prisma } from "@invocore/database";
import type { Router } from "express";
import { Router as createRouter } from "express";

import { createAuthGuard } from "../auth/guards/auth.guard.js";
import { createMembershipsRepository } from "../memberships/memberships.repository.js";
import { createMembershipsService } from "../memberships/memberships.service.js";
import { createTenantMiddleware } from "../memberships/tenant.middleware.js";
import {
  createOrganizationsController,
  createUserOrganizationsController
} from "./organizations.controller.js";

export function createOrganizationsModule(client: PrismaClient = prisma): Router {
  const router = createRouter();
  const membershipsRepository = createMembershipsRepository(client);
  const membershipsService = createMembershipsService(membershipsRepository);

  router.use(createAuthGuard());
  // Auth-only: list organizations the current user belongs to (used to resolve tenant context).
  router.use(createUserOrganizationsController(membershipsService));
  // Tenant-scoped routes below require an X-Organization-Id header.
  router.use(createTenantMiddleware({ membershipsRepository }));
  router.use(createOrganizationsController(membershipsService));

  return router;
}
