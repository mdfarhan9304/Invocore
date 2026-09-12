import type { PrismaClient } from "@invocore/database";
import { prisma } from "@invocore/database";
import type { Router } from "express";
import { Router as createRouter } from "express";

import { createAuthGuard } from "../auth/guards/auth.guard.js";
import { createMembershipsRepository } from "../memberships/memberships.repository.js";
import { createTenantMiddleware } from "../memberships/tenant.middleware.js";
import { createClientsController } from "./clients.controller.js";
import { createClientsRepository } from "./clients.repository.js";
import { createClientsService } from "./clients.service.js";

export function createClientsModule(client: PrismaClient = prisma): Router {
  const router = createRouter();
  const membershipsRepository = createMembershipsRepository(client);
  const clientsRepository = createClientsRepository(client);
  const clientsService = createClientsService(clientsRepository);

  router.use(createAuthGuard(), createTenantMiddleware({ membershipsRepository }));
  router.use(createClientsController(clientsService));

  return router;
}
