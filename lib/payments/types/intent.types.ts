import type { PricingResult } from "@/lib/payments/pricing.engine";

/* =========================================================
   CREATE INTENT
========================================================= */

export type ShippingInput = {
  name: string;
  phone: string;
  address_line: string;

  ward?: string | null;
  district?: string | null;
  region?: string | null;
  postal_code?: string | null;
};

export type CreatePiPaymentIntentInput = {
  userId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  country: string;
  zone: string;
  shipping: ShippingInput;
  pricing: PricingResult;
};

export type CreateIntentResult = {
  ok: boolean;
  payment_intent_id: string;
  amount: number;
  currency: "PI";
  merchant_wallet: string;
  memo: string;
  metadata: {
    payment_intent_id: string;
  };
};

/* =========================================================
   RAW INPUT (nếu có pipeline normalize)
========================================================= */

export type RawInput = {
  userId: string;
  raw: unknown;
};

/* =========================================================
   NORMALIZED INPUT (SERVICE LAYER)
========================================================= */

export type CreateIntentNormalizedInput = {
  userId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  country: string;
  zone: string;
  shipping: ShippingInput;
};

/* =========================================================
   SERVICE RESULT
========================================================= */

export type CreateIntentServiceResult = {
  payment_intent_id: string;
  pi_payment_id: string;
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
  to_address: string;
};

/* =========================================================
   CREATE PI PAYMENT INTENT PARAMS
========================================================= */

export type CreatePiPaymentIntentParams = {
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

export type SubmitPaymentNormalizedInput = {
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
