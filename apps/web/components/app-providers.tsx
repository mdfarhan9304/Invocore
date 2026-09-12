"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/lib/auth/auth-context";

export function AppProviders({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
