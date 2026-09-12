"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Loader2Icon } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth/auth-context";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isInitializing } = useAuth();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isInitializing, isAuthenticated, router]);

  if (isInitializing) {
    return (
      <div className="flex min-h-dvh items-center justify-center gap-3 text-sm text-muted-foreground">
        <Loader2Icon className="h-5 w-5 animate-spin" />
        <span>Loading your workspace</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
