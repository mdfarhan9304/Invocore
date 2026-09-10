import type { PrismaClient } from "@invocore/database";

import type { CoreDbClient } from "../../common/database/core-db-client.js";

export type RefreshTokenRecord = {
  id: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
};

export type AuthSessionRepository = {
  saveRefreshToken(input: { expiresAt: Date; tokenHash: string; userId: string }): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  revokeToken(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
};

export type AuthRepository = AuthSessionRepository & {
  withTransaction<T>(operation: (client: CoreDbClient) => Promise<T>): Promise<T>;
};

export function createAuthSessionRepository(client: CoreDbClient): AuthSessionRepository {
  return {
    async saveRefreshToken(input) {
      await client.refreshToken.create({
        data: {
          expiresAt: input.expiresAt,
          tokenHash: input.tokenHash,
          userId: input.userId
        }
      });
    },

    async findByTokenHash(tokenHash) {
      return client.refreshToken.findUnique({
        select: {
          id: true,
          userId: true,
          expiresAt: true,
          revokedAt: true
        },
        where: { tokenHash }
      });
    },

    async revokeToken(id) {
      await client.refreshToken.updateMany({
        data: { revokedAt: new Date() },
        where: { id, revokedAt: null }
      });
    },

    async revokeAllForUser(userId) {
      await client.refreshToken.updateMany({
        data: { revokedAt: new Date() },
        where: { userId, revokedAt: null }
      });
    }
  };
}

export function createAuthRepository(
  client: CoreDbClient & Pick<PrismaClient, "$transaction">
): AuthRepository {
  const sessionRepository = createAuthSessionRepository(client);

  return {
    ...sessionRepository,
    withTransaction(operation) {
      return client.$transaction((transaction) => operation(transaction));
    }
  };
}
