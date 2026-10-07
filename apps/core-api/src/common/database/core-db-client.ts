import type { PrismaClient } from "@invocore/database";

export type CoreDbClient = Pick<
  PrismaClient,
  | "client"
  | "invoice"
  | "invoiceDocument"
  | "invoiceLineItem"
  | "invoiceNumberSequence"
  | "invitation"
  | "membership"
  | "organization"
  | "payment"
  | "paymentLink"
  | "product"
  | "refreshToken"
  | "user"
>;
