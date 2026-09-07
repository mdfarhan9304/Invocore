import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";

import { asyncController } from "../../common/http/async-controller.js";
import type { AuthService } from "./auth.service.js";
import { parseLoginRequest, parseRegisterRequest } from "./dto/auth.validation.js";

export function createAuthController(authService: AuthService): Router {
  const router = createRouter();

  router.post(
    "/register",
    asyncController(async (request: Request, response: Response) => {
      const result = await authService.register(parseRegisterRequest(request.body));
      response.status(201).json(result);
    })
  );

  router.post(
    "/login",
    asyncController(async (request: Request, response: Response) => {
      const result = await authService.login(parseLoginRequest(request.body));
      response.status(200).json(result);
    })
  );

  return router;
}
