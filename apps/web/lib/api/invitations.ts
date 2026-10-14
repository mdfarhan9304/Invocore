import { request } from "./client";
import type { Invitation, InvitationList, InvitationRole } from "./types";

export const invitationsApi = {
  list(): Promise<InvitationList> {
    return request<InvitationList>("/invitations", { auth: true, org: true });
  },

  create(input: { email: string; role: InvitationRole }): Promise<{ invitation: Invitation }> {
    return request<{ invitation: Invitation }>("/invitations", {
      method: "POST",
      auth: true,
      org: true,
      body: input
    });
  }
};
