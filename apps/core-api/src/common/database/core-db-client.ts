import type { PrismaClient } from "@invocore/database";

export type CoreDbClient = Pick<
  PrismaClient,
  "membership" | "organization" | "refreshToken" | "user"
>;
