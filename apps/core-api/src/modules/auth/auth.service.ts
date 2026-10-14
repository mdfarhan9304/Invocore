import { AppError } from "@invocore/shared";

import type { CoreDbClient } from "../../common/database/core-db-client.js";
import {
  createOrganizationsRepository,
  type OrganizationsRepository
} from "../organizations/organizations.repository.js";
import { createUsersRepository, type UsersRepository } from "../users/users.repository.js";
import type { PublicUserRecord } from "../users/users.repository.js";
import { createAuthSessionRepository, type AuthRepository } from "./auth.repository.js";
import type { EmailVerificationService } from "./email-verification.service.js";
import type {
  AuthResponseDto,
  AuthUserDto,
  LoginRequestDto,
  LogoutRequestDto,
  RefreshRequestDto,
  RefreshResponseDto,
  RegisterRequestDto
} from "./dto/auth.dto.js";
import { hashPassword, verifyPassword } from "./password.js";
import {
  createRefreshToken,
  createRefreshTokenExpiry,
  hashRefreshToken,
  signAccessToken
} from "./token.service.js";

export type AuthService = {
  login(input: LoginRequestDto): Promise<AuthResponseDto>;
  logout(input: LogoutRequestDto): Promise<void>;
  refresh(input: RefreshRequestDto): Promise<RefreshResponseDto>;
  register(input: RegisterRequestDto): Promise<AuthResponseDto>;
  resendVerificationEmail(userId: string): Promise<void>;
  verifyEmail(token: string): Promise<{ user: AuthUserDto }>;
};

type AuthServiceDependencies = {
  authRepository: AuthRepository;
  createOrganizationsRepository?: (client: CoreDbClient) => OrganizationsRepository;
  createUsersRepository?: (client: CoreDbClient) => UsersRepository;
  emailVerificationService: EmailVerificationService;
  usersRepository: UsersRepository;
};

function toAuthUser(user: PublicUserRecord): AuthUserDto {
  return {
    email: user.email,
    emailVerified: user.emailVerified,
    id: user.id,
    name: user.name
  };
}

export function createAuthService({
  authRepository,
  createOrganizationsRepository: organizationsRepositoryFactory = createOrganizationsRepository,
  createUsersRepository: usersRepositoryFactory = createUsersRepository,
  emailVerificationService,
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
        user: toAuthUser(user)
      };
    },

    async logout(input) {
      const tokenHash = hashRefreshToken(input.refreshToken);
      const existing = await authRepository.findByTokenHash(tokenHash);
      if (existing && !existing.revokedAt) {
        await authRepository.revokeToken(existing.id);
      }
    },

    async refresh(input) {
      const tokenHash = hashRefreshToken(input.refreshToken);
      const existing = await authRepository.findByTokenHash(tokenHash);

      if (!existing || existing.expiresAt.getTime() <= Date.now()) {
        throw new AppError("Invalid refresh token", "INVALID_REFRESH_TOKEN", 401);
      }

      if (existing.revokedAt) {
        await authRepository.revokeAllForUser(existing.userId);
        throw new AppError("Invalid refresh token", "INVALID_REFRESH_TOKEN", 401);
      }

      const user = await usersRepository.findById(existing.userId);
      if (!user) {
        throw new AppError("Invalid refresh token", "INVALID_REFRESH_TOKEN", 401);
      }

      const nextRefreshToken = createRefreshToken();
      await authRepository.withTransaction(async (client) => {
        const sessionRepository = createAuthSessionRepository(client);
        await sessionRepository.revokeToken(existing.id);
        await sessionRepository.saveRefreshToken({
          expiresAt: createRefreshTokenExpiry(),
          tokenHash: nextRefreshToken.tokenHash,
          userId: existing.userId
        });
      });

      return {
        accessToken: signAccessToken({
          email: user.email,
          userId: user.id
        }),
        refreshToken: nextRefreshToken.token
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

      await emailVerificationService.sendForUser({
        organizationName: result.organization.name,
        userId: result.user.id
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
        user: toAuthUser(result.user)
      };
    },

    async resendVerificationEmail(userId) {
      await emailVerificationService.resendForUser({ userId });
    },

    async verifyEmail(token) {
      const { userId } = await emailVerificationService.verifyToken(token);
      const user = await usersRepository.findById(userId);
      if (!user) {
        throw new AppError("User not found", "USER_NOT_FOUND", 404);
      }

      return { user: toAuthUser(user) };
    }
  };
}
