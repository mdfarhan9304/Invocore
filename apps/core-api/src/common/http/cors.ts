import type { NextFunction, Request, RequestHandler, Response } from "express";

const ALLOWED_METHODS = "GET,POST,PATCH,PUT,DELETE,OPTIONS";
const ALLOWED_HEADERS = "Content-Type,Authorization,X-Organization-Id";
const MAX_AGE_SECONDS = "600";

export function createCorsMiddleware(allowedOrigins: string[]): RequestHandler {
  const allowAll = allowedOrigins.includes("*");
  const allowList = new Set(allowedOrigins);

  return (request: Request, response: Response, next: NextFunction) => {
    const origin = request.headers.origin;

    if (origin && (allowAll || allowList.has(origin))) {
      response.setHeader("Access-Control-Allow-Origin", allowAll ? "*" : origin);
      response.setHeader("Vary", "Origin");
      response.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS);
      response.setHeader("Access-Control-Allow-Headers", ALLOWED_HEADERS);
      response.setHeader("Access-Control-Max-Age", MAX_AGE_SECONDS);
    }

    if (request.method === "OPTIONS") {
      response.status(204).end();
      return;
    }

    next();
  };
}
