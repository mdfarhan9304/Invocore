import { loadConfig } from "@invocore/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/client/client.js";

export type {
  AuditLog,
  Client,
  Invoice,
  InvoiceLineItem,
  InvoiceNumberSequence,
  Membership,
  Organization,
  PrismaClient,
  Product,
  RefreshToken,
  User
} from "../generated/client/client.js";
export { InvoiceStatus, Prisma, Role } from "../generated/client/client.js";

export const PRISMA_SCHEMAS = {
  core: "core",
  payments: "payments",
  workers: "workers"
} as const;

export type PrismaSchemaName = keyof typeof PRISMA_SCHEMAS;

export type PrismaSetup = {
  datasourceUrl: string;
  schema: (typeof PRISMA_SCHEMAS)[PrismaSchemaName];
};

export function createPrismaSetup(schema: PrismaSchemaName = "core"): PrismaSetup {
  const config = loadConfig();
  const url = new URL(config.databaseUrl);

  url.searchParams.set("schema", PRISMA_SCHEMAS[schema]);

  return {
    datasourceUrl: url.toString(),
    schema: PRISMA_SCHEMAS[schema]
  };
}

export function createPrismaClient(schema: PrismaSchemaName = "core") {
  const setup = createPrismaSetup(schema);
  const adapter = new PrismaPg({ connectionString: setup.datasourceUrl });

  return new PrismaClient({ adapter });
}

export const prisma = createPrismaClient("core");
