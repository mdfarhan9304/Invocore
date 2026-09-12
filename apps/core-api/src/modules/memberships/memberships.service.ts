import type {
  MembershipsRepository,
  OrganizationMemberRecord,
  UserOrganizationRecord
} from "./memberships.repository.js";

export type MembershipsService = {
  listOrganizationMembers(organizationId: string): Promise<OrganizationMemberRecord[]>;
  listUserOrganizations(userId: string): Promise<UserOrganizationRecord[]>;
};

export function createMembershipsService(
  membershipsRepository: MembershipsRepository
): MembershipsService {
  return {
    listOrganizationMembers(organizationId) {
      return membershipsRepository.listByOrganization(organizationId);
    },

    listUserOrganizations(userId) {
      return membershipsRepository.listByUser(userId);
    }
  };
}
