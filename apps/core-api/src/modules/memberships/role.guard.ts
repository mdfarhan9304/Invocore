import type { Role } from "@invocore/database";
import { AppError } from "@invocore/shared";
import type { NextFunction, Request, RequestHandler, Response } from "express";

import { getTenantContext } from "../../common/http/context.js";

const FULL_ACCESS_ROLE: Role = "OWNER";

export function createRoleGuard(...allowedRoles: Role[]): RequestHandler {
  return (request: Request, _response: Response, next: NextFunction) => {
    try {
      const { role } = getTenantContext(request);
      if (role !== FULL_ACCESS_ROLE && !allowedRoles.includes(role)) {
        throw new AppError(
          "You do not have permission to perform this action",
          "INSUFFICIENT_ROLE",
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
