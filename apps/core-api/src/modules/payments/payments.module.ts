import { prisma, type PrismaClient } from "@invocore/database";
import express, { type Router } from "express";

import { createAuthGuard } from "../auth/guards/auth.guard.js";
import { createMembershipsRepository } from "../memberships/memberships.repository.js";
import { createTenantMiddleware } from "../memberships/tenant.middleware.js";
import {
  createPaymentsController,
  createRazorpayWebhookController
} from "./payments.controller.js";
import { PaymentsRepository } from "./payments.repository.js";
import { PaymentsService } from "./payments.service.js";

export function createPaymentsModule(client: PrismaClient = prisma) {
  const repository = new PaymentsRepository(client);
  const service = new PaymentsService(repository);
  const membershipsRepository = createMembershipsRepository(client);

  const invoiceRouter: Router = express.Router();
  invoiceRouter.use(createAuthGuard(), createTenantMiddleware({ membershipsRepository }));
  invoiceRouter.use(createPaymentsController(service));

  const webhookRouter: Router = express.Router();
  webhookRouter.use(
    express.raw({ type: "application/json", limit: "1mb" }),
    createRazorpayWebhookController(service)
  );

  return { invoiceRouter, webhookRouter };
}
