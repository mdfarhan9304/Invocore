import type { OrganizationRecord, OrganizationsRepository } from "./organizations.repository.js";

export type OrganizationsService = {
  createOwnerOrganization(input: { name: string; userId: string }): Promise<OrganizationRecord>;
};

export function createOrganizationsService(
  organizationsRepository: OrganizationsRepository
): OrganizationsService {
  return {
    createOwnerOrganization(input) {
      return organizationsRepository.createForOwner({
        name: input.name,
        role: "OWNER",
        userId: input.userId
      });
    }
  };
}
