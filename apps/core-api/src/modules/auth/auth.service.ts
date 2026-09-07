import { AppError } from "@invocore/shared";

import type { CoreDbClient } from "../../common/database/core-db-client.js";
import {
  createOrganizationsRepository,
  type OrganizationsRepository
} from "../organizations/organizations.repository.js";
import { createUsersRepository, type UsersRepository } from "../users/users.repository.js";
import { createAuthSessionRepository, type AuthRepository } from "./auth.repository.js";
import type { AuthResponseDto, LoginRequestDto, RegisterRequestDto } from "./dto/auth.dto.js";
import { hashPassword, verifyPassword } from "./password.js";
import { createRefreshToken, createRefreshTokenExpiry, signAccessToken } from "./token.service.js";

export type AuthService = {
  login(input: LoginRequestDto): Promise<AuthResponseDto>;
  register(input: RegisterRequestDto): Promise<AuthResponseDto>;
};

type AuthServiceDependencies = {
  authRepository: AuthRepository;
  createOrganizationsRepository?: (client: CoreDbClient) => OrganizationsRepository;
  createUsersRepository?: (client: CoreDbClient) => UsersRepository;
  usersRepository: UsersRepository;
};

export function createAuthService({
  authRepository,
  createOrganizationsRepository: organizationsRepositoryFactory = createOrganizationsRepository,
  createUsersRepository: usersRepositoryFactory = createUsersRepository,
  usersRepository
}: AuthServiceDependencies): AuthService {
  return {
    async login(input) {
      const user = await usersRepository.findByEmail(input.email);
      if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
        throw new AppError("Invalid email or password", "INVALID_CREDENTIALS", 401);
      }

      const refreshToken = createRefreshToken();
      await authRepository.saveRefreshToken({
        expiresAt: createRefreshTokenExpiry(),
        tokenHash: refreshToken.tokenHash,
        userId: user.id
      });

      return {
        accessToken: signAccessToken({
          email: user.email,
          userId: user.id
        }),
        refreshToken: refreshToken.token,
        user: {
          email: user.email,
          id: user.id,
          name: user.name
        }
      };
    },

    async register(input) {
      const refreshToken = createRefreshToken();
      const passwordHash = await hashPassword(input.password);
      const result = await authRepository.withTransaction(async (client) => {
        const transactionalAuthRepository = createAuthSessionRepository(client);
        const transactionalOrganizationsRepository = organizationsRepositoryFactory(client);
        const transactionalUsersRepository = usersRepositoryFactory(client);
        const user = await transactionalUsersRepository.create({
          email: input.email,
          name: input.name,
          passwordHash
        });
        const organization = await transactionalOrganizationsRepository.createForOwner({
          name: input.organizationName ?? `${input.name}'s Organization`,
          role: "OWNER",
          userId: user.id
        });

        await transactionalAuthRepository.saveRefreshToken({
          expiresAt: createRefreshTokenExpiry(),
          tokenHash: refreshToken.tokenHash,
          userId: user.id
        });

        return {
          organization,
          user
        };
      });

      return {
        accessToken: signAccessToken({
          email: result.user.email,
          userId: result.user.id
        }),
        refreshToken: refreshToken.token,
        organization: {
          id: result.organization.id,
          name: result.organization.name,
          role: "OWNER"
        },
        user: result.user
      };
    }
  };
}
