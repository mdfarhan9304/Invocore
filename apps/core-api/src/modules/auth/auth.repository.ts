import type { PrismaClient } from "@invocore/database";

import type { CoreDbClient } from "../../common/database/core-db-client.js";

export type AuthSessionRepository = {
  saveRefreshToken(input: { expiresAt: Date; tokenHash: string; userId: string }): Promise<void>;
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
