import type { PrismaClient } from "@invocore/database";

export type CoreDbClient = Pick<
  PrismaClient,
  | "client"
  | "emailVerification"
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
