import type { PrismaClient } from "@invocore/database";
import { prisma } from "@invocore/database";
import { loadConfig } from "@invocore/config";
import type { Router } from "express";

import { createOrganizationsRepository } from "../organizations/organizations.repository.js";
import { createUsersRepository } from "../users/users.repository.js";
import { createAuthController } from "./auth.controller.js";
import { createAuthRepository } from "./auth.repository.js";
import { createAuthService } from "./auth.service.js";
import { createResendVerificationEmailSender } from "./email-verification-email.service.js";
import { createEmailVerificationRepository } from "./email-verification.repository.js";
import { createEmailVerificationService } from "./email-verification.service.js";

export function createAuthModule(client: PrismaClient = prisma): Router {
  const authRepository = createAuthRepository(client);
  const usersRepository = createUsersRepository(client);
  const emailVerificationService = createEmailVerificationService({
    emailVerificationRepository: createEmailVerificationRepository(client),
    usersRepository,
    verificationEmailSender: createResendVerificationEmailSender(loadConfig().email)
  });
  const authService = createAuthService({
    authRepository,
    createOrganizationsRepository,
    createUsersRepository,
    emailVerificationService,
    usersRepository
  });

  return createAuthController(authService);
}
