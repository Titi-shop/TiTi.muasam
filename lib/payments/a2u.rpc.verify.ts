// lib/payments/a2u.rpc.verify.ts

import { getRpcTransaction } from "@/lib/rpc/client";
import { getWithdrawalById } from "@/lib/db/wallet.withdrawals";

const APP_MERCHANT_WALLET =
  process.env.PI_MERCHANT_WALLET?.trim() ?? "";

function log(
  tag: string,
  data?: unknown
) {
  console.log(
    `[A2U_RPC_VERIFY] ${tag}`,
    data ?? ""
  );
}

export type A2URpcVerifyResult = {
  verified: boolean;

  stage: string;
  reason: string;

  txid: string;

  amount: number | null;

  sender: string | null;
  receiver: string | null;

  ledger: number | null;

  confirmed: boolean;

  memo: string | null;

  rpcReachable: boolean;

  raw: unknown;
};

export async function verifyA2UWithdrawal(
  withdrawalId: string,
  txid: string
): Promise<A2URpcVerifyResult> {

  log("START", {
    withdrawalId,
    txid,
  });

  const withdrawal =
    await getWithdrawalById(
      withdrawalId
    );

  if (!withdrawal) {
    return {
      verified: false,

      stage: "WITHDRAWAL_NOT_FOUND",
      reason: "WITHDRAWAL_NOT_FOUND",

      txid,

      amount: null,

      sender: null,
      receiver: null,

      ledger: null,

      confirmed: false,

      memo: null,

      rpcReachable: false,

      raw: null,
    };
  }

  const rpc =
    await getRpcTransaction(
      txid
    );

  log("RPC_RESULT", {
    confirmed:
      rpc.confirmed,

    amount:
      rpc.amount,

    sender:
      rpc.sender,

    receiver:
      rpc.receiver,

    ledger:
      rpc.ledger,

    memo:
      rpc.memo,
  });

  if (!rpc.rpcReachable) {
    return {
      verified: false,

      stage:
        "RPC_UNREACHABLE",

      reason:
        "RPC_UNREACHABLE",

      txid,

      amount:
        rpc.amount,

      sender:
        rpc.sender,

      receiver:
        rpc.receiver,

      ledger:
        rpc.ledger,

      confirmed:
        rpc.confirmed,

      memo:
        rpc.memo,

      rpcReachable:
        false,

      raw:
        rpc.raw,
    };
  }

  if (!rpc.confirmed) {
    return {
      verified: false,

      stage:
        "TX_NOT_CONFIRMED",

      reason:
        "TX_NOT_CONFIRMED",

      txid,

      amount:
        rpc.amount,

      sender:
        rpc.sender,

      receiver:
        rpc.receiver,

      ledger:
        rpc.ledger,

      confirmed:
        false,

      memo:
        rpc.memo,

      rpcReachable:
        true,

      raw:
        rpc.raw,
    };
  }

  const expectedAmount =
    Number(
      withdrawal.amount
    );

  if (
    rpc.amount === null ||
    rpc.amount !==
      expectedAmount
  ) {
    return {
      verified: false,

      stage:
        "AMOUNT_MISMATCH",

      reason:
        "AMOUNT_MISMATCH",

      txid,

      amount:
        rpc.amount,

      sender:
        rpc.sender,

      receiver:
        rpc.receiver,

      ledger:
        rpc.ledger,

      confirmed:
        rpc.confirmed,

      memo:
        rpc.memo,

      rpcReachable:
        true,

      raw:
        rpc.raw,
    };
  }

  if (
    rpc.sender
      ?.toLowerCase() !==
    APP_MERCHANT_WALLET
      .toLowerCase()
  ) {
    return {
      verified: false,

      stage:
        "SENDER_MISMATCH",

      reason:
        "SENDER_MISMATCH",

      txid,

      amount:
        rpc.amount,

      sender:
        rpc.sender,

      receiver:
        rpc.receiver,

      ledger:
        rpc.ledger,

      confirmed:
        rpc.confirmed,

      memo:
        rpc.memo,

      rpcReachable:
        true,

      raw:
        rpc.raw,
    };
  }

  if (
    rpc.receiver
      ?.toLowerCase() !==
    withdrawal.withdraw_wallet
      .toLowerCase()
  ) {
    return {
      verified: false,

      stage:
        "RECEIVER_MISMATCH",

      reason:
        "RECEIVER_MISMATCH",

      txid,

      amount:
        rpc.amount,

      sender:
        rpc.sender,

      receiver:
        rpc.receiver,

      ledger:
        rpc.ledger,

      confirmed:
        rpc.confirmed,

      memo:
        rpc.memo,

      rpcReachable:
        true,

      raw:
        rpc.raw,
    };
  }

  if (
    withdrawal.pi_payment_id &&
    rpc.memo &&
    rpc.memo !==
      withdrawal.pi_payment_id
  ) {
    return {
      verified: false,

      stage:
        "MEMO_MISMATCH",

      reason:
        "MEMO_MISMATCH",

      txid,

      amount:
        rpc.amount,

      sender:
        rpc.sender,

      receiver:
        rpc.receiver,

      ledger:
        rpc.ledger,

      confirmed:
        rpc.confirmed,

      memo:
        rpc.memo,

      rpcReachable:
        true,

      raw:
        rpc.raw,
    };
  }

  return {
    verified: true,

    stage: "RPC_OK",
    reason: "NONE",

    txid,

    amount:
      rpc.amount,

    sender:
      rpc.sender,

    receiver:
      rpc.receiver,

    ledger:
      rpc.ledger,

    confirmed:
      rpc.confirmed,

    memo:
      rpc.memo,

    rpcReachable:
      true,

    raw:
      rpc.raw,
  };
}
