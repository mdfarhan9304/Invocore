import type { LucideIcon } from "lucide-react";

import type { DashboardSummary } from "@/lib/api/types";

export type KpiItem = {
  label: string;
  value: number;
  delta: string;
  detail: string;
  icon: LucideIcon;
  tone: "green" | "blue" | "red";
  spark: number[];
};

export type Range = "7D" | "30D" | "90D";

export type RevenueRange = {
  total: string;
  delta: string;
  compare: string;
  labels: string[];
  values: number[];
};

export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  icon: LucideIcon;
  tone: "green" | "blue" | "purple" | "red";
};

export type DashboardData = {
  summary: DashboardSummary | null;
  ranges: Record<Range, RevenueRange>;
  kpis: KpiItem[];
  activity: ActivityItem[];
};
