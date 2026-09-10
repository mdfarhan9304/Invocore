import type { PrismaClient } from "@invocore/database";
import { prisma } from "@invocore/database";
import type { Router } from "express";
import { Router as createRouter } from "express";

import { createAuthGuard } from "../auth/guards/auth.guard.js";
import { createMembershipsRepository } from "../memberships/memberships.repository.js";
import { createTenantMiddleware } from "../memberships/tenant.middleware.js";
import { createSessionController } from "./session.controller.js";

export function createSessionModule(client: PrismaClient = prisma): Router {
  const router = createRouter();
  const membershipsRepository = createMembershipsRepository(client);

  router.use(
    createAuthGuard(),
    createTenantMiddleware({ membershipsRepository }),
    createSessionController()
  );

  return router;
}
