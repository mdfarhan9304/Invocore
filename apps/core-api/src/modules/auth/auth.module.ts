import type { PrismaClient } from "@invocore/database";
import { prisma } from "@invocore/database";
import type { Router } from "express";

import { createOrganizationsRepository } from "../organizations/organizations.repository.js";
import { createUsersRepository } from "../users/users.repository.js";
import { createAuthController } from "./auth.controller.js";
import { createAuthRepository } from "./auth.repository.js";
import { createAuthService } from "./auth.service.js";

export function createAuthModule(client: PrismaClient = prisma): Router {
  const authRepository = createAuthRepository(client);
  const usersRepository = createUsersRepository(client);
  const authService = createAuthService({
    authRepository,
    createOrganizationsRepository,
    createUsersRepository,
    usersRepository
  });

  return createAuthController(authService);
}
