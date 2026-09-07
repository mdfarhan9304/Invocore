import express from "express";

import type { HealthResponse } from "@invocore/shared";

import { sendHttpError } from "./common/errors/http-error.js";
import { createAuthModule } from "./modules/auth/auth.module.js";

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_request, response) => {
    const body: HealthResponse = {
      service: "core-api",
      status: "ok"
    };

    response.status(200).json(body);
  });

  app.use("/auth", createAuthModule());

  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      next: express.NextFunction
    ) => {
      void next;
      sendHttpError(response, error);
    }
  );

  return app;
}
