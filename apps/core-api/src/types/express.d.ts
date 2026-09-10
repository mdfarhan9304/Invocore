import type { AuthContext, TenantContext } from "../common/http/context.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
      tenant?: TenantContext;
    }
  }
}

export {};
