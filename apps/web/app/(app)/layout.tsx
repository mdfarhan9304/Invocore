"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Loader2Icon } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth/auth-context";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isInitializing, user } = useAuth();

  useEffect(() => {
    if (isInitializing) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (user && user.emailVerified === false) {
      router.replace("/verify-email");
    }
  }, [isInitializing, isAuthenticated, user, router]);

  if (isInitializing) {
    return (
      <div className="flex min-h-dvh items-center justify-center gap-3 text-sm text-muted-foreground">
        <Loader2Icon className="h-5 w-5 animate-spin" />
        <span>Loading your workspace</span>
      </div>
    );
  }

  if (!isAuthenticated || user?.emailVerified === false) {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
