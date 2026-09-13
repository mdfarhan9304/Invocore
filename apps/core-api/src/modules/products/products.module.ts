import type { PrismaClient } from "@invocore/database";
import { prisma } from "@invocore/database";
import type { Router } from "express";
import { Router as createRouter } from "express";

import { createAuthGuard } from "../auth/guards/auth.guard.js";
import { createMembershipsRepository } from "../memberships/memberships.repository.js";
import { createTenantMiddleware } from "../memberships/tenant.middleware.js";
import { createProductsController } from "./products.controller.js";
import { createProductsRepository } from "./products.repository.js";
import { createProductsService } from "./products.service.js";

export function createProductsModule(client: PrismaClient = prisma): Router {
  const router = createRouter();
  const membershipsRepository = createMembershipsRepository(client);
  const productsRepository = createProductsRepository(client);
  const productsService = createProductsService(productsRepository);

  router.use(createAuthGuard(), createTenantMiddleware({ membershipsRepository }));
  router.use(createProductsController(productsService));

  return router;
}
