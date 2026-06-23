import { query } from "@/lib/db";

export type InsertA2URpcLogInput = {
  withdrawalId: string;
  piPaymentId: string | null;

  txid: string;

  verified: boolean;

  amount: number | null;

  sender: string | null;
  receiver: string | null;

  ledger: number | null;

  memo: string | null;

  txStatus: string | null;

  chainReference: string | null;

  createdAt: string | null;

  rpcReachable: boolean;

  parseLayer: string | null;

  hasMeta: boolean;
  hasEvents: boolean;

  senderFound: boolean;
  receiverFound: boolean;
  amountFound: boolean;

  payload: unknown;
  stage: string;
reason: string;
expectedAmount: number | null;
expectedReceiver: string | null;
amountMatch: boolean | null;
receiverMatch: boolean | null;
senderMatch: boolean | null;
verificationHash: string | null;
confirmed: boolean;
feeStroops: number | null;
latestLedger: number | null;
oldestLedger: number | null;
applicationOrder: number | null;
sourceAccount: string | null;
memoType: string | null;
};

function log(
  tag: string,
  data?: unknown
) {
  console.log(
    `[A2U_RPC_DB] ${tag}`,
    data ?? ""
  );
}

export async function insertA2URpcLog(
  input: InsertA2URpcLogInput
): Promise<void> {
  log("INSERT_START", {
    withdrawalId: input.withdrawalId,
    txid: input.txid,
  });

  await query(
  `
  INSERT INTO rpc_verification_logs (
    withdrawal_id,
    pi_payment_id,

    txid,
    verified,

    stage,
    reason,

    amount,
    expected_amount,

    sender,
    receiver,
    expected_receiver,

    amount_match,
    receiver_match,
    sender_match,

    verification_hash,

    ledger,

    tx_status,
    chain_reference,

    rpc_reachable,
    confirmed,

    parse_layer,

    has_meta,
    has_events,

    sender_found,
    receiver_found,
    amount_found,

    fee_stroops,
    latest_ledger,
    oldest_ledger,
    application_order,

    source_account,
    memo_type,

    memo,
    created_at_chain,

    payload,

    created_at,
    updated_at
  )
  VALUES (
    $1,$2,

    $3,$4,

    $5,$6,

    $7,$8,

    $9,$10,$11,

    $12,$13,$14,

    $15,

    $16,

    $17,$18,

    $19,$20,

    $21,

    $22,$23,

    $24,$25,$26,

    $27,$28,$29,$30,

    $31,$32,

    $33,$34,

    $35::jsonb,

    NOW(),
    NOW()
  )
  ON CONFLICT (txid)
  DO UPDATE SET

    verified = EXCLUDED.verified,

    stage = EXCLUDED.stage,
    reason = EXCLUDED.reason,

    amount = EXCLUDED.amount,
    expected_amount =
      EXCLUDED.expected_amount,

    sender = EXCLUDED.sender,
    receiver = EXCLUDED.receiver,

    expected_receiver =
      EXCLUDED.expected_receiver,

    amount_match =
      EXCLUDED.amount_match,

    receiver_match =
      EXCLUDED.receiver_match,

    sender_match =
      EXCLUDED.sender_match,

    verification_hash =
      EXCLUDED.verification_hash,

    ledger = EXCLUDED.ledger,

    tx_status =
      EXCLUDED.tx_status,

    chain_reference =
      EXCLUDED.chain_reference,

    rpc_reachable =
      EXCLUDED.rpc_reachable,

    confirmed =
      EXCLUDED.confirmed,

    parse_layer =
      EXCLUDED.parse_layer,

    has_meta =
      EXCLUDED.has_meta,

    has_events =
      EXCLUDED.has_events,

    sender_found =
      EXCLUDED.sender_found,

    receiver_found =
      EXCLUDED.receiver_found,

    amount_found =
      EXCLUDED.amount_found,

    fee_stroops =
      EXCLUDED.fee_stroops,

    latest_ledger =
      EXCLUDED.latest_ledger,

    oldest_ledger =
      EXCLUDED.oldest_ledger,

    application_order =
      EXCLUDED.application_order,

    source_account =
      EXCLUDED.source_account,

    memo_type =
      EXCLUDED.memo_type,

    memo =
      EXCLUDED.memo,

    created_at_chain =
      EXCLUDED.created_at_chain,

    payload =
      EXCLUDED.payload,

    updated_at = NOW()
  `,
  [
    input.withdrawalId,
    input.piPaymentId,

    input.txid,
    input.verified,

    input.stage,
    input.reason,

    input.amount,
    input.expectedAmount,

    input.sender,
    input.receiver,
    input.expectedReceiver,

    input.amountMatch,
    input.receiverMatch,
    input.senderMatch,

    input.verificationHash,

    input.ledger,

    input.txStatus,
    input.chainReference,

    input.rpcReachable,
    input.confirmed,

    input.parseLayer,

    input.hasMeta,
    input.hasEvents,

    input.senderFound,
    input.receiverFound,
    input.amountFound,

    input.feeStroops,
    input.latestLedger,
    input.oldestLedger,
    input.applicationOrder,

    input.sourceAccount,
    input.memoType,

    input.memo,
    input.createdAt,

    JSON.stringify(
      input.payload ?? {}
    ),
  ]
);

  log("INSERT_DONE", {
    txid: input.txid,
  });
}
