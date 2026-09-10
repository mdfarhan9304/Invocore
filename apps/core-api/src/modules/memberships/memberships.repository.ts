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

export type MembershipsRepository = {
  findByOrganizationAndUser(input: {
    organizationId: string;
    userId: string;
  }): Promise<MembershipRecord | null>;
  listByOrganization(organizationId: string): Promise<OrganizationMemberRecord[]>;
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
    }
  };
}
