import { request } from "./client";
import type { DashboardSummary } from "./types";

export const dashboardApi = {
  getSummary(): Promise<{ summary: DashboardSummary }> {
    return request<{ summary: DashboardSummary }>("/dashboard/summary", {
      auth: true,
      org: true
    });
  }
};
