import type { DashboardRepository } from "./dashboard.repository.js";

export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  getSummary(organizationId: string) {
    return this.repository.getSummary(organizationId);
  }
}
