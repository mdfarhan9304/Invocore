import type { PrismaClient } from "@invocore/database";

export type CoreDbClient = Pick<
  PrismaClient,
  "client" | "membership" | "organization" | "refreshToken" | "user"
>;
