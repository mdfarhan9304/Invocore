import { InvitationStatus, Prisma, type Role } from "@invocore/database";

import type { CoreDbClient } from "../../common/database/core-db-client.js";
import type { InvitationRole } from "./dto/invitations.dto.js";

export type InvitationRecord = {
  id: string;
  email: string;
  organizationName: string;
  role: InvitationRole;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
};

const invitationSelect = {
  id: true,
  email: true,
  organization: {
    select: { name: true }
  },
  role: true,
  status: true,
  expiresAt: true,
  createdAt: true,
  acceptedAt: true,
  revokedAt: true
} satisfies Prisma.InvitationSelect;

function toInvitationRecord(
  record: Prisma.InvitationGetPayload<{ select: typeof invitationSelect }>
): InvitationRecord {
  return {
    ...record,
    organizationName: record.organization.name,
    role: record.role as InvitationRole
  };
}

export type InvitationsRepository = {
  createOrReissue(input: {
    email: string;
    expiresAt: Date;
    invitedByUserId: string;
    organizationId: string;
    role: InvitationRole;
    tokenHash: string;
  }): Promise<InvitationRecord>;
  hasMembership(input: { email: string; organizationId: string }): Promise<boolean>;
  list(input: {
    limit: number;
    offset: number;
    organizationId: string;
  }): Promise<{ records: InvitationRecord[]; total: number }>;
  revoke(input: { id: string; organizationId: string }): Promise<void>;
};

export function createInvitationsRepository(client: CoreDbClient): InvitationsRepository {
  return {
    async createOrReissue(input) {
      const record = await client.invitation.upsert({
        create: {
          createdByUserId: input.invitedByUserId,
          email: input.email,
          expiresAt: input.expiresAt,
          organizationId: input.organizationId,
          role: input.role as Role,
          tokenHash: input.tokenHash
        },
        select: invitationSelect,
        update: {
          acceptedAt: null,
          createdByUserId: input.invitedByUserId,
          expiresAt: input.expiresAt,
          revokedAt: null,
          role: input.role as Role,
          status: InvitationStatus.PENDING,
          tokenHash: input.tokenHash
        },
        where: {
          organizationId_email: {
            email: input.email,
            organizationId: input.organizationId
          }
        }
      });

      return toInvitationRecord(record);
    },

    async hasMembership(input) {
      const membership = await client.membership.findFirst({
        select: { id: true },
        where: {
          organizationId: input.organizationId,
          user: { email: input.email }
        }
      });

      return Boolean(membership);
    },

    async list(input) {
      const where = { organizationId: input.organizationId };
      const [records, total] = await Promise.all([
        client.invitation.findMany({
          orderBy: { createdAt: "desc" },
          select: invitationSelect,
          skip: input.offset,
          take: input.limit,
          where
        }),
        client.invitation.count({ where })
      ]);

      return { records: records.map(toInvitationRecord), total };
    },

    async revoke(input) {
      await client.invitation.updateMany({
        data: {
          revokedAt: new Date(),
          status: InvitationStatus.REVOKED
        },
        where: {
          id: input.id,
          organizationId: input.organizationId,
          status: InvitationStatus.PENDING
        }
      });
    }
  };
}
