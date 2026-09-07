import { createHmac, randomBytes } from "node:crypto";

import { loadConfig } from "@invocore/config";

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

export function createRefreshToken() {
  const token = randomBytes(48).toString("base64url");
  const tokenHash = createHmac("sha256", loadConfig().auth.jwtSecret).update(token).digest("hex");

  return {
    token,
    tokenHash
  };
}

export function createRefreshTokenExpiry(): Date {
  const ttlDays = loadConfig().auth.refreshTokenTtlDays;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ttlDays);

  return expiresAt;
}
