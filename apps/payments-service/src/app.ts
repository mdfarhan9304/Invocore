import express from "express";

import type { HealthResponse } from "@invocore/shared";

export function createApp() {
  const app = express();

  app.get("/health", (_request, response) => {
    const body: HealthResponse = {
      service: "payments-service",
      status: "ok"
    };

    response.status(200).json(body);
  });

  return app;
}
