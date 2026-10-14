import { createHash, randomBytes } from "node:crypto";

import type { CoreDbClient } from "../../common/database/core-db-client.js";

const VERIFICATION_TTL_HOURS = 24;

export type EmailVerificationRecord = {
  id: string;
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
};

function createVerificationToken(): { token: string; tokenHash: string } {
  const token = randomBytes(48).toString("base64url");
  return {
    token,
    tokenHash: createHash("sha256").update(token).digest("hex")
  };
}

function createVerificationExpiry(): Date {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + VERIFICATION_TTL_HOURS);
  return expiresAt;
}

export type EmailVerificationRepository = {
  createForUser(userId: string): Promise<{ token: string }>;
  findActiveByTokenHash(tokenHash: string): Promise<EmailVerificationRecord | null>;
  markUsed(id: string): Promise<void>;
};

export function createEmailVerificationRepository(
  client: CoreDbClient
): EmailVerificationRepository {
  return {
    async createForUser(userId) {
      const { token, tokenHash } = createVerificationToken();

      await client.emailVerification.create({
        data: {
          expiresAt: createVerificationExpiry(),
          tokenHash,
          userId
        }
      });

      return { token };
    },

    async findActiveByTokenHash(tokenHash) {
      const record = await client.emailVerification.findUnique({
        select: {
          expiresAt: true,
          id: true,
          usedAt: true,
          userId: true
        },
        where: { tokenHash }
      });

      if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
        return null;
      }

      return record;
    },

    async markUsed(id) {
      await client.emailVerification.updateMany({
        data: { usedAt: new Date() },
        where: { id, usedAt: null }
      });
    }
  };
}

export function hashEmailVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
