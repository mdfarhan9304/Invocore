import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { loadConfig } from "@invocore/config";
import { AppError } from "@invocore/shared";

type AccessTokenPayload = {
  sub: string;
  email: string;
  exp: number;
  iat: number;
};

function base64UrlEncode(value: Buffer | string): string {
  return Buffer.from(value)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlDecode(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

export function signAccessToken(input: { email: string; userId: string }): string {
  const config = loadConfig();
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: AccessTokenPayload = {
    email: input.email,
    exp: issuedAt + config.auth.accessTokenTtlSeconds,
    iat: issuedAt,
    sub: input.userId
  };
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac("sha256", config.auth.jwtSecret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();

  return `${encodedHeader}.${encodedPayload}.${base64UrlEncode(signature)}`;
}

export type AccessTokenClaims = {
  email: string;
  userId: string;
};

export function verifyAccessToken(token: string): AccessTokenClaims {
  const config = loadConfig();
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new AppError("Invalid access token", "INVALID_TOKEN", 401);
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  let header: { alg?: unknown };
  try {
    header = JSON.parse(base64UrlDecode(encodedHeader).toString("utf8")) as { alg?: unknown };
  } catch {
    throw new AppError("Invalid access token", "INVALID_TOKEN", 401);
  }
  if (header.alg !== "HS256") {
    throw new AppError("Invalid access token", "INVALID_TOKEN", 401);
  }

  const expectedSignature = createHmac("sha256", config.auth.jwtSecret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  const providedSignature = base64UrlDecode(encodedSignature);
  if (
    expectedSignature.length !== providedSignature.length ||
    !timingSafeEqual(expectedSignature, providedSignature)
  ) {
    throw new AppError("Invalid access token", "INVALID_TOKEN", 401);
  }

  let payload: AccessTokenPayload;
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8")) as AccessTokenPayload;
  } catch {
    throw new AppError("Invalid access token", "INVALID_TOKEN", 401);
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp <= now) {
    throw new AppError("Access token expired", "TOKEN_EXPIRED", 401);
  }
  if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
    throw new AppError("Invalid access token", "INVALID_TOKEN", 401);
  }

  return { email: payload.email, userId: payload.sub };
}

export function hashRefreshToken(token: string): string {
  return createHmac("sha256", loadConfig().auth.jwtSecret).update(token).digest("hex");
}

export function createRefreshToken() {
  const token = randomBytes(48).toString("base64url");

  return {
    token,
    tokenHash: hashRefreshToken(token)
  };
}

export function createRefreshTokenExpiry(): Date {
  const ttlDays = loadConfig().auth.refreshTokenTtlDays;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ttlDays);

  return expiresAt;
}
