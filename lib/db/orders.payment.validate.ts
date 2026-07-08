import { auditManualReview } from "@/lib/db/payments.audit";
import { getRpcVerificationLog } from "@/lib/db/payments.rpc";
import type { PoolClient } from "pg";

import type {
  RpcPayload,
  ShippingSnapshot,
  StrictPaymentValidationInput,
  ValidateFinalizePaymentInput,
  FinalizeValidationResult,
} from "./orders.payment.types";
import {
  logger,
  maskId,
} from "@/lib/logger";
/* =========================================================
   HELPERS
========================================================= */

export function toNumber(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error("INVALID_NUMBER");
  }

  return parsed;
}

export function isSameAmount(
  left: number,
  right: number
): boolean {
  return Math.abs(left - right) < 0.0000001;
}

/* =========================================================
   SHIPPING SNAPSHOT
========================================================= */

type PricingSnapshotItem = {
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

type PricingSnapshot = {
  subtotal: number;
  shipping_fee: number;
  total: number;
  items: PricingSnapshotItem[];
};

type ShippingSnapshotPayload = {
  buyer_shipping?: ShippingSnapshot;
  pricing_snapshot?: PricingSnapshot;
};

export function parseShippingSnapshot(
  rawSnapshot: unknown
): {
  shipping: ShippingSnapshot;
  pricing: PricingSnapshot;
} {
  const snapshot: ShippingSnapshotPayload =
    typeof rawSnapshot === "string"
      ? (JSON.parse(rawSnapshot) as ShippingSnapshotPayload)
      : (rawSnapshot as ShippingSnapshotPayload);

  const shipping =
    snapshot.buyer_shipping ??
    (snapshot as unknown as ShippingSnapshot);

  const pricing = snapshot.pricing_snapshot;

  if (!pricing) {
    throw new Error(
      "PRICING_SNAPSHOT_MISSING"
    );
  }

  return {
    shipping,
    pricing,
  };
}

/* =========================================================
   SHIPPING VALIDATION
========================================================= */

export async function validateShippingSnapshot(
  paymentIntentId: string,
  shipping: ShippingSnapshot,
  client: PoolClient
): Promise<void> {
  if (
    !shipping.name ||
    !shipping.phone ||
    !shipping.address_line
  ) {
    await auditManualReview(
      paymentIntentId,
      "INVALID_SHIPPING_SNAPSHOT",
      { shipping },
      client
    );

    throw new Error(
      "INVALID_SHIPPING_SNAPSHOT"
    );
  }
}

/* =========================================================
   RPC VALIDATION
========================================================= */

export async function validateRpcPayload(
  paymentIntentId: string,
  rpcPayload: RpcPayload,
  client: PoolClient
): Promise<void> {
  logger.info("PAYMENT.VALIDATE.RPC_START", {
  paymentIntentId: maskId(paymentIntentId),
  confirmed: rpcPayload.confirmed,
  txStatus: rpcPayload.txStatus,
});

  if (!rpcPayload.confirmed) {
    logger.warn("PAYMENT.VALIDATE.RPC_NOT_CONFIRMED", {
  paymentIntentId: maskId(paymentIntentId),
});

    await auditManualReview(
      paymentIntentId,
      "RPC_NOT_CONFIRMED",
      rpcPayload,
      client
    );

    throw new Error(
      "RPC_NOT_CONFIRMED"
    );
  }

  if (
    rpcPayload.txStatus !==
    "SUCCESS"
  ) {
    logger.warn("PAYMENT.VALIDATE.RPC_TX_FAILED", {
  paymentIntentId: maskId(paymentIntentId),
  txStatus: rpcPayload.txStatus,
});

    await auditManualReview(
      paymentIntentId,
      "RPC_TX_FAILED",
      rpcPayload,
      client
    );

    throw new Error(
      "RPC_TX_FAILED"
    );
  }

  if (
    rpcPayload.reason &&
    rpcPayload.reason !== "NONE"
  ) {
    logger.warn("PAYMENT.VALIDATE.RPC_REASON_FAILED", {
  paymentIntentId: maskId(paymentIntentId),
  reason: rpcPayload.reason,
});

    await auditManualReview(
      paymentIntentId,
      "RPC_REASON_FAILED",
      rpcPayload,
      client
    );

    throw new Error(
      "RPC_REASON_FAILED"
    );
  }

  if (!rpcPayload.ledger) {
    logger.warn("PAYMENT.VALIDATE.RPC_LEDGER_MISSING", {
  paymentIntentId: maskId(paymentIntentId),
});

    await auditManualReview(
      paymentIntentId,
      "RPC_LEDGER_MISSING",
      rpcPayload,
      client
    );

    throw new Error(
      "RPC_LEDGER_MISSING"
    );
  }

  logger.info("PAYMENT.VALIDATE.RPC_VALIDATED", {
  paymentIntentId: maskId(paymentIntentId),
});
}

/* =========================================================
   STRICT PAYMENT VALIDATION
========================================================= */

export async function validateStrictPayment(
  input: StrictPaymentValidationInput,
  client: PoolClient
): Promise<void> {
  const {
    paymentIntentId,
    expectedAmount,
    verifiedAmount,
    merchantWallet,
    receiverWallet,
    txid,
    rpcPayload,
} = input;

  logger.info("PAYMENT.VALIDATE.START", {
  paymentIntentId: maskId(paymentIntentId),
});

  if (
    !isSameAmount(
      expectedAmount,
      verifiedAmount
    )
  ) {
    logger.warn("PAYMENT.VALIDATE.AMOUNT_MISMATCH", {
  paymentIntentId: maskId(paymentIntentId),
});

    await auditManualReview(
      paymentIntentId,
      "AMOUNT_MISMATCH",
      {
        expectedAmount,
        verifiedAmount,
      },
      client
    );

    throw new Error(
      "AMOUNT_MISMATCH"
    );
  }

  if (
    merchantWallet
      .trim()
      .toLowerCase() !==
    receiverWallet
      .trim()
      .toLowerCase()
  ) {
    logger.warn("PAYMENT.VALIDATE.RECEIVER_MISMATCH", {
  paymentIntentId: maskId(paymentIntentId),
});

    await auditManualReview(
      paymentIntentId,
      "RECEIVER_MISMATCH",
      {
        expected:
          merchantWallet,
        got:
          receiverWallet,
      },
      client
    );

    throw new Error(
      "RECEIVER_MISMATCH"
    );
  }

  if (!txid) {
    logger.warn("PAYMENT.VALIDATE.TXID_MISSING", {
  paymentIntentId: maskId(paymentIntentId),
});

    await auditManualReview(
      paymentIntentId,
      "TXID_MISSING",
      {},
      client
    );

    throw new Error(
      "TXID_MISSING"
    );
  }

  logger.debug("PAYMENT.VALIDATE.TXID_OK");

  if (
    rpcPayload.chainReference &&
    rpcPayload.chainReference !==
      txid
  ) {
    logger.warn("PAYMENT.VALIDATE.TXID_MISMATCH", {
  paymentIntentId: maskId(paymentIntentId),
});

    await auditManualReview(
      paymentIntentId,
      "TXID_MISMATCH",
      {
        txid,
        chainReference:
          rpcPayload.chainReference,
      },
      client
    );

    throw new Error(
      "TXID_MISMATCH"
    );
  }

  logger.debug("PAYMENT.VALIDATE.CHAIN_REFERENCE_OK");

  if (
    rpcPayload.amount != null &&
    !isSameAmount(
      expectedAmount,
      rpcPayload.amount
    )
  ) {
    logger.warn("PAYMENT.VALIDATE.RPC_AMOUNT_MISMATCH", {
  paymentIntentId: maskId(paymentIntentId),
});

    await auditManualReview(
      paymentIntentId,
      "RPC_AMOUNT_MISMATCH",
      {
        expectedAmount,
        rpcAmount:
          rpcPayload.amount,
      },
      client
    );

    throw new Error(
      "RPC_AMOUNT_MISMATCH"
    );
  }

  if (
    rpcPayload.receiver &&
    rpcPayload.receiver
      .trim()
      .toLowerCase() !==
      merchantWallet
        .trim()
        .toLowerCase()
  ) {
    logger.warn("PAYMENT.VALIDATE.RPC_RECEIVER_MISMATCH", {
  paymentIntentId: maskId(paymentIntentId),
});

    await auditManualReview(
      paymentIntentId,
      "RPC_RECEIVER_MISMATCH",
      {
        expected:
          merchantWallet,
        rpcReceiver:
          rpcPayload.receiver,
      },
      client
    );

    throw new Error(
      "RPC_RECEIVER_MISMATCH"
    );
  }

  await validateRpcPayload(
    paymentIntentId,
    rpcPayload,
    client
  );

  logger.info("PAYMENT.VALIDATE.PAYMENT_VALIDATED", {
  paymentIntentId: maskId(paymentIntentId),
});
}
/* =========================================================
   FINALIZE VALIDATION
========================================================= */

export async function validateFinalizePayment(
  input: ValidateFinalizePaymentInput
): Promise<FinalizeValidationResult> {
  const {
    client,
    paymentIntentId,
    verifiedAmount,
    receiverWallet,
    txid,
    intent,
} = input;

  logger.info("PAYMENT.VALIDATE.FINALIZE_START", {
  paymentIntentId: maskId(paymentIntentId),
});
const rpcPayload =
    await getRpcVerificationLog(paymentIntentId);

if (!rpcPayload) {
    throw new Error("RPC_LOG_NOT_FOUND");
}
  const {
    shipping,
    pricing,
  } = parseShippingSnapshot(
    intent.shipping_snapshot
  );

  await validateShippingSnapshot(
    paymentIntentId,
    shipping,
    client
  );

  const expectedAmount =
    toNumber(
      intent.total_amount
    );

  const pricingTotal =
    Number(
      pricing.total
    );

  if (
    !isSameAmount(
      pricingTotal,
      expectedAmount
    )
  ) {
    logger.warn("PAYMENT.VALIDATE.PRICING_TOTAL_MISMATCH", {
  paymentIntentId: maskId(paymentIntentId),
});

    await auditManualReview(
      paymentIntentId,
      "PRICING_TOTAL_MISMATCH",
      {
        pricingTotal,
        expectedAmount,
      },
      client
    );

    throw new Error(
      "PRICING_TOTAL_MISMATCH"
    );
  }

  await validateStrictPayment(
    {
      paymentIntentId,
      expectedAmount,
      verifiedAmount,
      merchantWallet:
        intent.merchant_wallet,
      receiverWallet,
      txid,
      rpcPayload,
    },
    client
  );

  logger.info("PAYMENT.VALIDATE.FINALIZE_OK", {
  paymentIntentId: maskId(paymentIntentId),
});

  return {
    shipping,
    pricing,
    expectedAmount,
  };
}
