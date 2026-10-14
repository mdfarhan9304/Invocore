import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";

import { asyncController } from "../../common/http/async-controller.js";
import type { AuthService } from "./auth.service.js";
import { createAuthGuard } from "./guards/auth.guard.js";
import { getAuthContext } from "../../common/http/context.js";
import {
  parseLoginRequest,
  parseLogoutRequest,
  parseRefreshRequest,
  parseRegisterRequest,
  parseVerifyEmailRequest
} from "./dto/auth.validation.js";

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

  router.post(
    "/refresh",
    asyncController(async (request: Request, response: Response) => {
      const result = await authService.refresh(parseRefreshRequest(request.body));
      response.status(200).json(result);
    })
  );

  router.post(
    "/logout",
    asyncController(async (request: Request, response: Response) => {
      await authService.logout(parseLogoutRequest(request.body));
      response.status(204).send();
    })
  );

  router.post(
    "/verify-email",
    asyncController(async (request: Request, response: Response) => {
      const result = await authService.verifyEmail(parseVerifyEmailRequest(request.body).token);
      response.status(200).json(result);
    })
  );

  router.post(
    "/resend-verification",
    createAuthGuard(),
    asyncController(async (request: Request, response: Response) => {
      const auth = getAuthContext(request);
      await authService.resendVerificationEmail(auth.userId);
      response.status(204).send();
    })
  );

  return router;
}
