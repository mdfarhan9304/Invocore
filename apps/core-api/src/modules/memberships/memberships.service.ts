import type { MembershipsRepository, OrganizationMemberRecord } from "./memberships.repository.js";

export type MembershipsService = {
  listOrganizationMembers(organizationId: string): Promise<OrganizationMemberRecord[]>;
};

export function createMembershipsService(
  membershipsRepository: MembershipsRepository
): MembershipsService {
  return {
    listOrganizationMembers(organizationId) {
      return membershipsRepository.listByOrganization(organizationId);
    }
  };
}
