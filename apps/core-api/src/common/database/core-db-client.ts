import type { PrismaClient } from "@invocore/database";

export type CoreDbClient = Pick<
  PrismaClient,
  | "client"
  | "invoice"
  | "invoiceLineItem"
  | "invoiceNumberSequence"
  | "membership"
  | "organization"
  | "product"
  | "refreshToken"
  | "user"
>;
