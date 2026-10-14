import { AppError } from "@invocore/shared";

import type { UsersRepository } from "../users/users.repository.js";
import type { VerificationEmailSender } from "./email-verification-email.service.js";
import {
  hashEmailVerificationToken,
  type EmailVerificationRepository
} from "./email-verification.repository.js";

export type EmailVerificationService = {
  resendForUser(input: { organizationName?: string; userId: string }): Promise<void>;
  sendForUser(input: { organizationName?: string; userId: string }): Promise<void>;
  verifyToken(token: string): Promise<{ userId: string }>;
};

type EmailVerificationServiceDependencies = {
  emailVerificationRepository: EmailVerificationRepository;
  usersRepository: UsersRepository;
  verificationEmailSender: VerificationEmailSender;
};

export function createEmailVerificationService({
  emailVerificationRepository,
  usersRepository,
  verificationEmailSender
}: EmailVerificationServiceDependencies): EmailVerificationService {
  async function sendForUser(input: { organizationName?: string; userId: string }) {
    const user = await usersRepository.findById(input.userId);
    if (!user) {
      throw new AppError("User not found", "USER_NOT_FOUND", 404);
    }

    if (user.emailVerified) {
      return;
    }

    const { token } = await emailVerificationRepository.createForUser(user.id);
    await verificationEmailSender.send({
      email: user.email,
      idempotencyKey: `verify-${user.id}-${Date.now()}`,
      organizationName: input.organizationName,
      token,
      userName: user.name
    });
  }

  return {
    async resendForUser(input) {
      await sendForUser(input);
    },

    sendForUser,

    async verifyToken(token) {
      const tokenHash = hashEmailVerificationToken(token.trim());
      const record = await emailVerificationRepository.findActiveByTokenHash(tokenHash);
      if (!record) {
        throw new AppError(
          "This verification link is invalid or has expired",
          "INVALID_VERIFICATION_TOKEN",
          400
        );
      }

      await emailVerificationRepository.markUsed(record.id);
      await usersRepository.markEmailVerified(record.userId);

      return { userId: record.userId };
    }
  };
}
