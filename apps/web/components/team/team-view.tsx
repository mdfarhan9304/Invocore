"use client";

import { useCallback, useEffect, useState } from "react";
import { MailPlusIcon, ShieldCheckIcon } from "lucide-react";

import { InviteMemberForm } from "@/components/team/invite-member-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { EmptyState, TableSkeleton } from "@/components/ui/feedback";
import { FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import { invitationsApi } from "@/lib/api/invitations";
import { organizationsApi } from "@/lib/api/organizations";
import type { Invitation, InvitationRole, OrganizationMember, Role } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";

type LoadStatus = "loading" | "ready" | "error";

const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  ACCOUNTANT: "Accountant",
  VIEWER: "Viewer"
};

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  OWNER: "Full workspace authority. Owners can invite Admins and receive all future permissions.",
  ADMIN:
    "Runs daily operations, including workspace settings and team management. Admins cannot invite other Admins.",
  ACCOUNTANT: "Can work with invoices and reports, without workspace administration.",
  VIEWER: "Read-only access to workspace information."
};

function RoleBadge({ role }: { role: Role }) {
  return <Badge variant={role === "OWNER" ? "default" : "secondary"}>{ROLE_LABELS[role]}</Badge>;
}

function getAllowedInvitationRoles(role: Role): InvitationRole[] {
  return role === "OWNER" ? ["ADMIN", "ACCOUNTANT", "VIEWER"] : ["ACCOUNTANT", "VIEWER"];
}

export function TeamView() {
  const { activeOrganization } = useAuth();
  const role = activeOrganization?.role;
  const canManageTeam = role === "OWNER" || role === "ADMIN";
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const loadTeam = useCallback(async () => {
    if (!activeOrganization || !canManageTeam) {
      return;
    }

    setStatus("loading");
    setErrorMessage(null);
    try {
      const [{ members: loadedMembers }, invitationList] = await Promise.all([
        organizationsApi.listMembers(),
        invitationsApi.list()
      ]);
      setMembers(loadedMembers);
      setInvitations(invitationList.data.filter((invitation) => invitation.status === "PENDING"));
      setStatus("ready");
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Unable to load your team.");
      setStatus("error");
    }
  }, [activeOrganization, canManageTeam]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  if (!activeOrganization || !role) {
    return null;
  }

  if (!canManageTeam) {
    return (
      <EmptyState
        icon={<ShieldCheckIcon className="h-10 w-10" />}
        title="Team management is restricted"
        description="Only workspace Owners and Admins can view members and send invitations."
      />
    );
  }

  const allowedRoles = getAllowedInvitationRoles(role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl">Team & roles</h1>
          <p className="text-sm text-muted-foreground">
            Manage access to {activeOrganization.name}. Your role: <RoleBadge role={role} />
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <MailPlusIcon className="h-4 w-4" />
          Invite member
        </Button>
      </div>

      <section className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_4px_14px_rgba(23,53,45,0.04)]">
        <h2 className="text-sm font-semibold">Your access</h2>
        <p className="mt-1 text-sm text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
      </section>

      {status === "loading" ? <TableSkeleton rows={4} /> : null}
      {status === "error" ? (
        <FormAlert>
          <div className="flex items-center justify-between gap-4">
            <span>{errorMessage}</span>
            <Button variant="secondary" size="sm" onClick={() => void loadTeam()}>
              Retry
            </Button>
          </div>
        </FormAlert>
      ) : null}

      {status === "ready" ? (
        <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_4px_14px_rgba(23,53,45,0.04)]">
          <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Members</h2>
              <p className="text-xs text-muted-foreground">{members.length} active members</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f8f8f8] text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Member</th>
                  <th className="px-4 py-2.5 font-medium">Email</th>
                  <th className="px-4 py-2.5 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.userId} className="border-t border-[#e5e7eb]">
                    <td className="px-4 py-3 font-medium text-[#17352d]">{member.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={member.role} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {status === "ready" && invitations.length > 0 ? (
        <section className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_4px_14px_rgba(23,53,45,0.04)]">
          <h2 className="text-sm font-semibold">Pending invitations</h2>
          <ul className="mt-3 divide-y divide-[#e5e7eb]">
            {invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <span className="min-w-0 truncate text-muted-foreground">{invitation.email}</span>
                <RoleBadge role={invitation.role} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a team member</DialogTitle>
            <DialogDescription>
              {role === "OWNER"
                ? "Owners can invite Admins, Accountants, and Viewers."
                : "Admins can invite Accountants and Viewers."}
            </DialogDescription>
          </DialogHeader>
          <InviteMemberForm
            allowedRoles={allowedRoles}
            onCancel={() => setInviteOpen(false)}
            onSuccess={() => {
              setInviteOpen(false);
              void loadTeam();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
