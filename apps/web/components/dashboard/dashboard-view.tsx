"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { Reveal } from "@/components/marketing/reveal";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { dashboardApi } from "@/lib/api/dashboard";
import { useAuth } from "@/lib/auth/auth-context";
import { ActivityPanel } from "./activity-panel";
import { KpiCard } from "./kpi-card";
import { RevenueChart } from "./revenue-chart";
import { buildActivity, buildKpis, buildRanges } from "./dashboard-utils";

export function DashboardView() {
  const { activeOrganization } = useAuth();
  const summaryQuery = useQuery({
    queryKey: ["dashboard", "summary", activeOrganization?.id ?? "none"],
    queryFn: dashboardApi.getSummary,
    enabled: Boolean(activeOrganization),
    refetchInterval: 10000
  });
  const summary = summaryQuery.data?.summary ?? null;
  const error = summaryQuery.error
    ? summaryQuery.error instanceof ApiError
      ? summaryQuery.error.message
      : "Failed to load dashboard."
    : null;

  const ranges = useMemo(() => buildRanges(summary?.revenueByDay ?? []), [summary]);
  const kpis = useMemo(() => buildKpis(summary), [summary]);
  const activity = useMemo(() => buildActivity(summary), [summary]);

  if (summaryQuery.isPending || !activeOrganization) {
    return <div className="text-sm text-muted-foreground">Loading dashboard…</div>;
  }

  return (
    <div className="space-y-6">
      <Reveal className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold text-[#3c7560]">Workspace snapshot</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#17352d]">
            Good morning, here is your overview.
          </h1>
          <p className="mt-2 text-sm text-[#789087]">
            A clear view of the work moving through your business.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="self-start border-[#dfe6e1] bg-white text-[#60756c] shadow-sm sm:self-auto"
        >
          This month <ChevronDownIcon />
        </Button>
      </Reveal>
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item, index) => (
          <KpiCard key={item.label} item={item} index={index} />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <RevenueChart ranges={ranges} />
        <ActivityPanel activity={activity} />
      </div>
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <span aria-hidden="true" className="ml-1 text-xs">
      ⌄
    </span>
  );
}
