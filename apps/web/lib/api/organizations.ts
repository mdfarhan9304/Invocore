import { request } from "./client";
import type { OrganizationMember, UserOrganization } from "./types";

export type CreateOrganizationInput = {
  name: string;
};

export const organizationsApi = {
  listMine(): Promise<{ organizations: UserOrganization[] }> {
    return request<{ organizations: UserOrganization[] }>("/organizations", { auth: true });
  },

  create(input: CreateOrganizationInput): Promise<{ organization: UserOrganization }> {
    return request<{ organization: UserOrganization }>("/organizations", {
      method: "POST",
      auth: true,
      body: input
    });
  },

  listMembers(): Promise<{ members: OrganizationMember[] }> {
    return request<{ members: OrganizationMember[] }>("/organizations/current/members", {
      auth: true,
      org: true
    });
  }
};
