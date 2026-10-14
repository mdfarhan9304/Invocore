import type { PrismaClient } from "@invocore/database";
import { prisma } from "@invocore/database";
import { loadConfig } from "@invocore/config";
import type { Router } from "express";
import { Router as createRouter } from "express";

import { createResendVerificationEmailSender } from "../auth/email-verification-email.service.js";
import { createEmailVerificationRepository } from "../auth/email-verification.repository.js";
import { createEmailVerificationService } from "../auth/email-verification.service.js";
import { createAuthGuard } from "../auth/guards/auth.guard.js";
import { createMembershipsRepository } from "../memberships/memberships.repository.js";
import { createMembershipsService } from "../memberships/memberships.service.js";
import { createTenantMiddleware } from "../memberships/tenant.middleware.js";
import { createUsersRepository } from "../users/users.repository.js";
import { createOrganizationsRepository } from "./organizations.repository.js";
import {
  createOrganizationsController,
  createUserOrganizationsController
} from "./organizations.controller.js";
import { createOrganizationsService } from "./organizations.service.js";

export function createOrganizationsModule(client: PrismaClient = prisma): Router {
  const router = createRouter();
  const membershipsRepository = createMembershipsRepository(client);
  const usersRepository = createUsersRepository(client);
  const membershipsService = createMembershipsService(membershipsRepository);
  const organizationsRepository = createOrganizationsRepository(client);
  const emailVerificationService = createEmailVerificationService({
    emailVerificationRepository: createEmailVerificationRepository(client),
    usersRepository,
    verificationEmailSender: createResendVerificationEmailSender(loadConfig().email)
  });
  const organizationsService = createOrganizationsService(
    organizationsRepository,
    emailVerificationService
  );

  router.use(createAuthGuard());
  router.use(createUserOrganizationsController(membershipsService, organizationsService));
  router.use(
    createTenantMiddleware({
      membershipsRepository,
      usersRepository
    })
  );
  router.use(createOrganizationsController(membershipsService));

  return router;
}
