import { request } from "./client";
import type { UserOrganization } from "./types";

export const organizationsApi = {
  listMine(): Promise<{ organizations: UserOrganization[] }> {
    return request<{ organizations: UserOrganization[] }>("/organizations", { auth: true });
  }
};
