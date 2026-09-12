import type { Role } from "@invocore/database";

import type { CoreDbClient } from "../../common/database/core-db-client.js";

export type MembershipRecord = {
  role: Role;
};

export type OrganizationMemberRecord = {
  email: string;
  name: string;
  role: Role;
  userId: string;
};

export type UserOrganizationRecord = {
  id: string;
  name: string;
  role: Role;
};

export type MembershipsRepository = {
  findByOrganizationAndUser(input: {
    organizationId: string;
    userId: string;
  }): Promise<MembershipRecord | null>;
  listByOrganization(organizationId: string): Promise<OrganizationMemberRecord[]>;
  listByUser(userId: string): Promise<UserOrganizationRecord[]>;
};

export function createMembershipsRepository(client: CoreDbClient): MembershipsRepository {
  return {
    findByOrganizationAndUser(input) {
      return client.membership.findUnique({
        select: {
          role: true
        },
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId: input.userId
          }
        }
      });
    },

    async listByOrganization(organizationId) {
      const memberships = await client.membership.findMany({
        orderBy: {
          createdAt: "asc"
        },
        select: {
          role: true,
          user: {
            select: {
              email: true,
              name: true
            }
          },
          userId: true
        },
        where: {
          organizationId
        }
      });

      return memberships.map((membership) => ({
        email: membership.user.email,
        name: membership.user.name,
        role: membership.role,
        userId: membership.userId
      }));
    },

    async listByUser(userId) {
      const memberships = await client.membership.findMany({
        orderBy: {
          createdAt: "asc"
        },
        select: {
          organizationId: true,
          role: true,
          organization: {
            select: {
              name: true
            }
          }
        },
        where: {
          userId
        }
      });

      return memberships.map((membership) => ({
        id: membership.organizationId,
        name: membership.organization.name,
        role: membership.role
      }));
    }
  };
}
