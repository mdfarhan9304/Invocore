export type RazorpayPaymentLink = {
  id: string;
  amount: number;
  amount_paid: number;
  currency: string;
  short_url: string;
  status: "created" | "active" | "partially_paid" | "paid" | "cancelled" | "expired";
  expire_by?: number;
};

export type RazorpayPaymentLinkResponse = RazorpayPaymentLink;

export type RazorpayWebhookPayload = {
  event:
    | "payment_link.paid"
    | "payment_link.partially_paid"
    | "payment_link.cancelled"
    | "payment_link.expired"
    | string;
  payload?: {
    payment_link?: {
      entity?: RazorpayPaymentLink & {
        reference_id?: string | null;
      };
    };
    payment?: {
      entity?: {
        id: string;
        amount: number;
        currency: string;
        method?: string | null;
        status: string;
        created_at: number;
      };
    };
  };
};
