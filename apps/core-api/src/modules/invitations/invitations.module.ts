import type { PrismaClient } from "@invocore/database";
import { prisma } from "@invocore/database";
import { loadConfig } from "@invocore/config";
import type { Router } from "express";
import { Router as createRouter } from "express";

import { createAuthGuard } from "../auth/guards/auth.guard.js";
import { createMembershipsRepository } from "../memberships/memberships.repository.js";
import { createTenantMiddleware } from "../memberships/tenant.middleware.js";
import { createInvitationsController } from "./invitations.controller.js";
import { createResendInvitationEmailSender } from "./invitation-email.service.js";
import { createInvitationsRepository } from "./invitations.repository.js";
import { createInvitationsService } from "./invitations.service.js";

export function createInvitationsModule(client: PrismaClient = prisma): Router {
  const router = createRouter();
  const membershipsRepository = createMembershipsRepository(client);
  const invitationsRepository = createInvitationsRepository(client);
  const invitationsService = createInvitationsService(
    invitationsRepository,
    createResendInvitationEmailSender(loadConfig().email)
  );

  router.use(createAuthGuard(), createTenantMiddleware({ membershipsRepository }));
  router.use(createInvitationsController(invitationsService));

  return router;
}
