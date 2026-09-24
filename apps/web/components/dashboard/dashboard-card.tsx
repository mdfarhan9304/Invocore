import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function DashboardCard({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("rounded-xl bg-[#f5f6f5] p-1 shadow-[inset_0_0_0_0.8px_#e5e7eb]", className)}
    >
      <div className="relative flex min-h-0 h-full flex-col overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
        {children}
      </div>
    </section>
  );
}
