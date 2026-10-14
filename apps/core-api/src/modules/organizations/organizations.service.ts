import type { EmailVerificationService } from "../auth/email-verification.service.js";
import type { OrganizationRecord, OrganizationsRepository } from "./organizations.repository.js";

export type OrganizationDto = OrganizationRecord & {
  role: "OWNER";
};

export type OrganizationsService = {
  createOwnerOrganization(input: { name: string; userId: string }): Promise<OrganizationDto>;
};

export function createOrganizationsService(
  organizationsRepository: OrganizationsRepository,
  emailVerificationService: EmailVerificationService
): OrganizationsService {
  return {
    async createOwnerOrganization(input) {
      const organization = await organizationsRepository.createForOwner({
        name: input.name,
        role: "OWNER",
        userId: input.userId
      });

      await emailVerificationService.sendForUser({
        organizationName: organization.name,
        userId: input.userId
      });

      return {
        ...organization,
        role: "OWNER"
      };
    }
  };
}
