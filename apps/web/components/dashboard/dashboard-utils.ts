import { BadgeIndianRupee, CircleAlert, Send, TrendingUp, WalletCards } from "lucide-react";

import type { DashboardSummary, InvoiceStatus } from "@/lib/api/types";
import type { ActivityItem, KpiItem, Range, RevenueRange } from "@/types/dashboard";

export function buildRanges(
  revenueByDay: DashboardSummary["revenueByDay"]
): Record<Range, RevenueRange> {
  const build = (days: number, groupSize: number, compare: string): RevenueRange => {
    const selected = revenueByDay.length
      ? revenueByDay.slice(-days)
      : Array.from({ length: days }, (_, index) => ({
          date: new Date(Date.now() - (days - index - 1) * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10),
          amount: 0
        }));
    const groups = Array.from({ length: Math.ceil(days / groupSize) }, (_, index) =>
      selected.slice(index * groupSize, (index + 1) * groupSize)
    );
    const values = groups.map((group) => group.reduce((sum, day) => sum + day.amount, 0));
    const total = values.reduce((sum, value) => sum + value, 0);
    return {
      total: formatValue(total),
      delta: "Live",
      compare,
      labels: groups.map((group, index) => {
        const date = new Date(`${group[0]?.date ?? ""}T00:00:00Z`);
        return days <= 7
          ? date.toLocaleDateString(undefined, { weekday: "short" })
          : `${date.toLocaleDateString(undefined, { month: "short" })} ${index + 1}`;
      }),
      values
    };
  };

  return {
    "7D": build(7, 1, "vs previous week"),
    "30D": build(30, 7, "vs previous month"),
    "90D": build(90, 15, "vs previous quarter")
  };
}

export function buildKpis(summary: DashboardSummary | null): KpiItem[] {
  const values = summary?.revenueByDay.map((day) => day.amount) ?? [];
  const spark = values.length ? values.slice(-12) : [0];
  return [
    {
      label: "Total Revenue",
      value: summary?.totalRevenue ?? 0,
      delta: "Live",
      detail: "verified payments",
      icon: TrendingUp,
      tone: "green",
      spark
    },
    {
      label: "Outstanding",
      value: summary?.outstanding ?? 0,
      delta: "Live",
      detail: `across ${summary?.outstandingCount ?? 0} invoices`,
      icon: WalletCards,
      tone: "blue",
      spark
    },
    {
      label: "Overdue",
      value: summary?.overdue ?? 0,
      delta: summary?.overdueCount ? "Needs review" : "All clear",
      detail: `${summary?.overdueCount ?? 0} invoices`,
      icon: CircleAlert,
      tone: "red",
      spark
    },
    {
      label: "Paid This Month",
      value: summary?.paidThisMonth ?? 0,
      delta: "Live",
      detail: "verified payments",
      icon: BadgeIndianRupee,
      tone: "green",
      spark
    }
  ];
}

export function buildActivity(summary: DashboardSummary | null): ActivityItem[] {
  if (!summary?.recentInvoices.length) {
    return [];
  }
  return summary.recentInvoices.map((invoice) => {
    const status = invoice.status as InvoiceStatus;
    const title =
      status === "PAID"
        ? "Payment received"
        : status === "OVERDUE"
          ? "Payment needs review"
          : "Invoice updated";
    const tone: ActivityItem["tone"] =
      status === "OVERDUE" ? "red" : status === "PAID" ? "green" : "blue";
    return {
      id: invoice.id,
      title,
      detail: `${invoice.invoiceNumber ?? "Draft invoice"} · ${invoice.clientName}`,
      time: new Date(invoice.updatedAt).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit"
      }),
      icon: status === "PAID" ? BadgeIndianRupee : status === "OVERDUE" ? CircleAlert : Send,
      tone
    };
  });
}

export function formatValue(value: number): string {
  return `₹${Math.round(value / 100).toLocaleString("en-IN")}`;
}
