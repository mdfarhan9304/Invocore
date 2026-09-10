import { AppError } from "@invocore/shared";
import type { NextFunction, Request, RequestHandler, Response } from "express";

import { setAuthContext } from "../../../common/http/context.js";
import { verifyAccessToken } from "../token.service.js";

const BEARER_PREFIX = "Bearer ";

export function createAuthGuard(): RequestHandler {
  return (request: Request, _response: Response, next: NextFunction) => {
    try {
      const header = request.headers.authorization;
      if (!header || !header.startsWith(BEARER_PREFIX)) {
        throw new AppError("Missing or invalid Authorization header", "UNAUTHORIZED", 401);
      }

      const token = header.slice(BEARER_PREFIX.length).trim();
      if (!token) {
        throw new AppError("Missing or invalid Authorization header", "UNAUTHORIZED", 401);
      }

      setAuthContext(request, verifyAccessToken(token));
      next();
    } catch (error) {
      next(error);
    }
  };
}
