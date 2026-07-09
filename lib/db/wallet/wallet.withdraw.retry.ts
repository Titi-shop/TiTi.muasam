// =====================================================
// lib/db/wallet/wallet.withdraw.retry.ts
// =====================================================

import {
  query,
} from "@/lib/db";

import {
  createWithdrawalSettlementEventOnce,
  WithdrawalSettlementEvents,
} from "@/lib/db/settlement/settlement.event.a2u";

import {
  logger,
} from "@/lib/logger";

export async function retryWithdrawal(
  withdrawalId: string
): Promise<void> {

  logger.info(
  "WALLET_WITHDRAW.RETRY_START"
);

  const result =
    await query(
      `
      UPDATE wallet_withdrawals
      SET

        status = 'APPROVED',

        fail_reason = NULL,

        pi_payment_id = NULL,
        pi_uid = NULL,
        pi_payment_memo = NULL,

        blockchain_txid = NULL,
        txid = NULL,

        blockchain_ledger = NULL,
        blockchain_memo = NULL,
        blockchain_fee = NULL,

        blockchain_from_address = NULL,
        blockchain_to_address = NULL,
        blockchain_network = NULL,

        paid_at = NULL,
        completed_at = NULL

      WHERE id = $1
        AND status = 'FAILED'
      `,
      [
        withdrawalId,
      ]
    );

  logger.debug(
  "WALLET_WITHDRAW.RETRY_UPDATED"
);

  if (
    result.rowCount !== 1
  ) {
    throw new Error(
      "WITHDRAWAL_RETRY_FAILED"
    );
  }

  await createWithdrawalSettlementEventOnce({

    withdrawalId,

    eventType:
      WithdrawalSettlementEvents.WITHDRAW_RETRY,

    source:
      "wallet.withdraw",

    reason:
      "Withdrawal retry requested",

    metadata: {},

  });

  logger.info(
  "WALLET_WITHDRAW.RETRY_DONE"
);
}
