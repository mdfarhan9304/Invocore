import type { Role } from "@invocore/database";

import type { CoreDbClient } from "../../common/database/core-db-client.js";

export type OrganizationRecord = {
  id: string;
  name: string;
};

export type OrganizationsRepository = {
  createForOwner(input: { name: string; role: Role; userId: string }): Promise<OrganizationRecord>;
};

export function createOrganizationsRepository(client: CoreDbClient): OrganizationsRepository {
  return {
    createForOwner(input) {
      return client.organization.create({
        data: {
          name: input.name,
          memberships: {
            create: {
              role: input.role,
              userId: input.userId
            }
          }
        },
        select: {
          id: true,
          name: true
        }
      });
    }
  };
}
