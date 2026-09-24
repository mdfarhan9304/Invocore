import type { PrismaClient } from "@invocore/database";

export type CoreDbClient = Pick<
  PrismaClient,
  | "client"
  | "invoice"
  | "invoiceDocument"
  | "invoiceLineItem"
  | "invoiceNumberSequence"
  | "membership"
  | "organization"
  | "product"
  | "refreshToken"
  | "user"
>;
