import { createHash, randomBytes } from "node:crypto";

import { Role } from "@invocore/database";
import { AppError } from "@invocore/shared";

import type {
  CreateInvitationRequestDto,
  InvitationDto,
  InvitationListDto,
  InvitationRole,
  ListInvitationsQuery
} from "./dto/invitations.dto.js";
import type { InvitationRecord, InvitationsRepository } from "./invitations.repository.js";
import type { InvitationEmailSender } from "./invitation-email.service.js";

const INVITATION_TTL_DAYS = 7;

function toInvitationDto(record: InvitationRecord): InvitationDto {
  return {
    id: record.id,
    email: record.email,
    role: record.role,
    status: record.status,
    isExpired: record.status === "PENDING" && record.expiresAt.getTime() <= Date.now(),
    expiresAt: record.expiresAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
    acceptedAt: record.acceptedAt?.toISOString() ?? null,
    revokedAt: record.revokedAt?.toISOString() ?? null
  };
}

function createInvitationToken(): { token: string; tokenHash: string } {
  const token = randomBytes(48).toString("base64url");
  return {
    token,
    tokenHash: createHash("sha256").update(token).digest("hex")
  };
}

function createInvitationExpiry(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION_TTL_DAYS);
  return expiresAt;
}

function assertInvitableRole(inviterRole: Role, requestedRole: InvitationRole): void {
  const allowedRoles =
    inviterRole === Role.OWNER
      ? ["ADMIN", "ACCOUNTANT", "VIEWER"]
      : inviterRole === Role.ADMIN
        ? ["ACCOUNTANT", "VIEWER"]
        : [];

  if (!allowedRoles.includes(requestedRole)) {
    throw new AppError(
      "You cannot invite a member with that role",
      "INVITATION_ROLE_NOT_ALLOWED",
      403
    );
  }
}

export type InvitationsService = {
  createInvitation(input: {
    data: CreateInvitationRequestDto;
    invitedByUserId: string;
    inviterRole: Role;
    organizationId: string;
  }): Promise<InvitationDto>;
  listInvitations(input: {
    organizationId: string;
    query: ListInvitationsQuery;
  }): Promise<InvitationListDto>;
  revokeInvitation(input: { invitationId: string; organizationId: string }): Promise<void>;
};

export function createInvitationsService(
  invitationsRepository: InvitationsRepository,
  invitationEmailSender: InvitationEmailSender
): InvitationsService {
  return {
    async createInvitation(input) {
      assertInvitableRole(input.inviterRole, input.data.role);

      if (
        await invitationsRepository.hasMembership({
          email: input.data.email,
          organizationId: input.organizationId
        })
      ) {
        throw new AppError(
          "That email already belongs to this organization",
          "MEMBER_ALREADY_EXISTS",
          409
        );
      }

      const { token, tokenHash } = createInvitationToken();
      const record = await invitationsRepository.createOrReissue({
        email: input.data.email,
        expiresAt: createInvitationExpiry(),
        invitedByUserId: input.invitedByUserId,
        organizationId: input.organizationId,
        role: input.data.role,
        tokenHash
      });

      await invitationEmailSender.send({
        acceptToken: token,
        email: record.email,
        idempotencyKey: `invitation:${record.id}:${tokenHash}`,
        organizationName: record.organizationName
      });

      return toInvitationDto(record);
    },

    async listInvitations(input) {
      const { records, total } = await invitationsRepository.list({
        limit: input.query.limit,
        offset: input.query.offset,
        organizationId: input.organizationId
      });

      return {
        data: records.map(toInvitationDto),
        pagination: {
          limit: input.query.limit,
          offset: input.query.offset,
          total
        }
      };
    },

    async revokeInvitation(input) {
      await invitationsRepository.revoke({
        id: input.invitationId,
        organizationId: input.organizationId
      });
    }
  };
}
