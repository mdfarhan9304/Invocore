import type { PrismaClient } from "@invocore/database";

export type CoreDbClient = Pick<PrismaClient, "organization" | "refreshToken" | "user">;
