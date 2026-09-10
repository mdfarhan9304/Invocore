import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";

import { getAuthContext, getTenantContext } from "../../common/http/context.js";

export function createSessionController(): Router {
  const router = createRouter();

  router.get("/", (request: Request, response: Response) => {
    const auth = getAuthContext(request);
    const tenant = getTenantContext(request);

    response.status(200).json({
      organization: {
        id: tenant.organizationId,
        role: tenant.role
      },
      user: {
        email: auth.email,
        id: auth.userId
      }
    });
  });

  return router;
}
