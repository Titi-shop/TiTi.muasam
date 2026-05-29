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
export type RpcPayload = {
  ok: boolean;

  amount?: number | null;
  ledger?: number | null;
  chainReference?: string | null;
  stage?: string | null;
  sender?: string | null;
  receiver?: string | null;
  reason?: string | null;
  confirmed?: boolean;
  txStatus?: string | null;
  memo?: string | null;

  createdAt?: string | null;

  payload?: unknown;
};
export type PiPayload = {
  user_uid?: string | null;
  from_address?: string | null;
  to_address?: string | null;
  amount?: number | string | null;
  identifier?: string | null;
  memo?: string | null;
  network?: string | null;
  created_at?: string | null;

  transaction?: {
    txid?: string | null;
    verified?: boolean;
  };

  status?: {
    developer_approved?: boolean;
    developer_completed?: boolean;
    transaction_verified?: boolean;
    cancelled?: boolean;
    user_cancelled?: boolean;
  };
};

export type ShippingSnapshot = {
  name?: string | null;
  phone?: string | null;
  address_line?: string | null;
  ward?: string | null;
  district?: string | null;
  region?: string | null;
  country?: string | null;
  postal_code?: string | null;
};

export type PaymentIntentRow = {
  id: string;

  buyer_id: string;
  seller_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: string;
  subtotal: string;
  discount: string;
  shipping_fee: string;
  total_amount: string;
  currency: string;
  shipping_snapshot: any;
  country: string;
  zone: string;
  merchant_wallet: string;
  status: string;
  settlement_state: string;
};

export type FinalizePaidOrderParams = {
  paymentIntentId: string;
  piPaymentId: string;
  txid: string;
  verifiedAmount: number;
  receiverWallet: string;
  piPayload: PiPayload;
  rpcPayload: RpcPayload;
};

export type FinalizePaidOrderResult = {
  ok: boolean;
  already: boolean;
  orderId: string | null;
  buyerId: string;
  sellerId: string;
  amount: number;
};
