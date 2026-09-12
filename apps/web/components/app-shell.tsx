"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, organizations, activeOrganization, selectOrganization, logout } = useAuth();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold tracking-tight text-slate-900">Invocore</span>
            {organizations.length > 0 ? (
              <>
                <span className="text-slate-300" aria-hidden>
                  /
                </span>
                <label htmlFor="organization-switcher" className="sr-only">
                  Active organization
                </label>
                <select
                  id="organization-switcher"
                  value={activeOrganization?.id ?? ""}
                  onChange={(event) => selectOrganization(event.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name} · {organization.role}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <span className="hidden text-sm text-slate-500 sm:inline">{user.email}</span>
            ) : null}
            <Button variant="secondary" size="sm" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
