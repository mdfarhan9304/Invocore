import express from "express";

import { loadConfig } from "@invocore/config";
import type { HealthResponse } from "@invocore/shared";

import { sendHttpError } from "./common/errors/http-error.js";
import { createCorsMiddleware } from "./common/http/cors.js";
import { createAuthModule } from "./modules/auth/auth.module.js";
import { createClientsModule } from "./modules/clients/clients.module.js";
import { createInvoicesModule } from "./modules/invoices/invoices.module.js";
import { createOrganizationsModule } from "./modules/organizations/organizations.module.js";
import { createProductsModule } from "./modules/products/products.module.js";
import { createSessionModule } from "./modules/session/session.module.js";

export function createApp() {
  const app = express();

  app.use(createCorsMiddleware(loadConfig().corsOrigins));
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_request, response) => {
    const body: HealthResponse = {
      service: "core-api",
      status: "ok"
    };

    response.status(200).json(body);
  });

  app.use("/auth", createAuthModule());
  app.use("/me", createSessionModule());
  app.use("/organizations", createOrganizationsModule());
  app.use("/clients", createClientsModule());
  app.use("/products", createProductsModule());
  app.use("/invoices", createInvoicesModule());

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
