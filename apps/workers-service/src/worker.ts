import type { HealthResponse } from "@invocore/shared";

export type WorkerStatus = {
  status: "running";
} & Omit<HealthResponse, "status">;

export function createWorkerStatus(): WorkerStatus {
  return {
    service: "workers-service",
    status: "running"
  };
}
