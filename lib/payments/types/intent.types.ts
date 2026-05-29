import type {
  PricingResult,
} from "@/lib/payments/pricing.engine";

/* =========================================================
   CREATE INTENT
========================================================= */

export type RawInput = {
  userId: string;
  raw: unknown;
};

export type ShippingInput = {
  name: string;
  phone: string;
  address_line: string;

  ward?: string | null;
  district?: string | null;
  region?: string | null;
  postal_code?: string | null;
};

export type CreateIntentNormalizedInput =
  {
    userId: string;
    productId: string;
    variantId: string | null;
    quantity: number;
    country: string;
    zone: string;
    shipping: ShippingInput;
  };

export type CreateIntentServiceResult =
  {
    payment_intent_id: string;
    pi_payment_id: string;
    amount: number;
    memo: string;
    metadata: Record<
      string,
      unknown
    >;
    to_address: string;
  };

export type CreatePiPaymentIntentParams =
  {
    userId: string;
    productId: string;
    variantId: string | null;
    quantity: number;
    country: string;
    zone: string;
    shipping: ShippingInput;
    pricing: PricingResult;
  };

/* =========================================================
   SUBMIT PAYMENT
========================================================= */

export type SubmitPaymentBody = {
  payment_intent_id: string;
  pi_payment_id: string;
  txid: string;
};

export type SubmitPaymentNormalizedInput =
  {
    paymentIntentId: string;
    piPaymentId: string;
    txid: string;
    userId: string;
  };

export type SubmitVerifyResult =
  | {
      ok: true;
      already: boolean;
      status: string;
      paymentIntentId: string;
    }
  | {
      ok: false;
      code: string;
    };
