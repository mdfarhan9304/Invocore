import type { PrismaClient } from "@invocore/database";
import { prisma } from "@invocore/database";
import type { Router } from "express";
import { Router as createRouter } from "express";

import { createAuthGuard } from "../auth/guards/auth.guard.js";
import { createMembershipsRepository } from "../memberships/memberships.repository.js";
import { createTenantMiddleware } from "../memberships/tenant.middleware.js";
import { createInvoicesController } from "./invoices.controller.js";
import { createInvoicesRepository } from "./invoices.repository.js";
import { createInvoicesService } from "./invoices.service.js";

export function createInvoicesModule(client: PrismaClient = prisma): Router {
  const router = createRouter();
  const membershipsRepository = createMembershipsRepository(client);
  const invoicesRepository = createInvoicesRepository(client);
  const invoicesService = createInvoicesService(invoicesRepository, client);

  router.use(createAuthGuard(), createTenantMiddleware({ membershipsRepository }));
  router.use(createInvoicesController(invoicesService));

  return router;
}
