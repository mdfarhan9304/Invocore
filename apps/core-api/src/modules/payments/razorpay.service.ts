import { createHmac, timingSafeEqual } from "node:crypto";

import axios from "axios";

import { loadConfig } from "@invocore/config";

import type { RazorpayPaymentLinkResponse, RazorpayWebhookPayload } from "./payment.types.js";

const RAZORPAY_API_BASE_URL = "https://api.razorpay.com/v1";

export function createRazorpayClient() {
  const config = loadConfig();
  if (!config.payments.razorpayKeyId || !config.payments.razorpayKeySecret) {
    throw new Error("Razorpay credentials are not configured");
  }

  return axios.create({
    baseURL: RAZORPAY_API_BASE_URL,
    auth: {
      username: config.payments.razorpayKeyId,
      password: config.payments.razorpayKeySecret
    },
    headers: {
      "Content-Type": "application/json"
    },
    timeout: 10000
  });
}

export async function createRazorpayPaymentLink(input: {
  amount: number;
  currency: string;
  referenceId: string;
  description: string;
  customer: { name: string; email?: string | null; contact?: string | null };
  expiresAt: Date | null;
}) {
  const config = loadConfig();
  const client = createRazorpayClient();
  const expiresBy = input.expiresAt ? Math.floor(input.expiresAt.getTime() / 1000) : undefined;

  const response = await client.post<RazorpayPaymentLinkResponse>("/payment_links", {
    amount: input.amount,
    currency: input.currency,
    reference_id: input.referenceId,
    description: input.description,
    customer: input.customer,
    accept_partial: true,
    reminder_enable: false,
    notify: { sms: false, email: false },
    callback_url: `${config.payments.appUrl.replace(/\/$/, "")}/pay/invoices/complete`,
    callback_method: "get",
    ...(expiresBy ? { expire_by: expiresBy } : {})
  });

  return response.data;
}

export function verifyRazorpayWebhookSignature(
  rawBody: Buffer,
  signature: string | undefined
): boolean {
  const secret = loadConfig().payments.razorpayWebhookSecret;
  if (!secret || !signature) {
    return false;
  }

  const expected = Buffer.from(createHmac("sha256", secret).update(rawBody).digest("hex"), "utf8");
  const received = Buffer.from(signature, "utf8");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function parseRazorpayWebhook(rawBody: Buffer): RazorpayWebhookPayload {
  return JSON.parse(rawBody.toString("utf8")) as RazorpayWebhookPayload;
}
