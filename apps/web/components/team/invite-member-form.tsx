"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormAlert } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import { invitationsApi } from "@/lib/api/invitations";
import type { InvitationRole } from "@/lib/api/types";

const ROLE_LABELS: Record<InvitationRole, string> = {
  ADMIN: "Admin",
  ACCOUNTANT: "Accountant",
  VIEWER: "Viewer"
};

type InviteMemberFormProps = {
  allowedRoles: InvitationRole[];
  onCancel: () => void;
  onSuccess: () => void;
};

export function InviteMemberForm({ allowedRoles, onCancel, onSuccess }: InviteMemberFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitationRole>(allowedRoles[0]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!allowedRoles.includes(role)) {
      setRole(allowedRoles[0]);
    }
  }, [allowedRoles, role]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await invitationsApi.create({ email: email.trim(), role });
      onSuccess();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Unable to send invitation.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {errorMessage ? <FormAlert>{errorMessage}</FormAlert> : null}
      <Field htmlFor="member-email" label="Email address" required>
        <Input
          id="member-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@company.com"
          required
          disabled={isSubmitting}
        />
      </Field>
      <Field htmlFor="member-role" label="Role" required>
        <Select value={role} onValueChange={(value) => setRole(value as InvitationRole)}>
          <SelectTrigger id="member-role" className="w-full" disabled={isSubmitting}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allowedRoles.map((allowedRole) => (
              <SelectItem key={allowedRole} value={allowedRole}>
                {ROLE_LABELS[allowedRole]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send invitation"}
        </Button>
      </div>
    </form>
  );
}
