// =====================================================
// lib/db/wallet/wallet.withdraw.approve.ts
// =====================================================

import {
  createHash,
} from "crypto";

import {
  withTransaction,
} from "@/lib/db";

import {
  reserveWalletBalance,
} from "./wallet.balance";

import {
  createWalletJournal,
} from "./wallet.journal";

import {
  createWithdrawalSettlementEventOnce,
  WithdrawalSettlementEvents,
} from "@/lib/db/settlement/settlement.event.a2u";

function vlog(
  step: string,
  data?: unknown
) {
  console.log(
    `[WALLET_WITHDRAW][${step}]`,
    data ?? ""
  );
}

export async function approveWalletWithdrawal(
  withdrawalId: string,
  adminId: string
): Promise<void> {

  vlog(
    "APPROVE_START",
    {
      withdrawalId,
      adminId,
    }
  );

  await withTransaction(
    async (client) => {

      const withdrawalRs =
        await client.query<{
          user_id: string;
          amount: string;
          status: string;
        }>(
          `
          SELECT
            user_id,
            amount,
            status
          FROM wallet_withdrawals
          WHERE id = $1
          FOR UPDATE
          `,
          [
            withdrawalId,
          ]
        );

      if (
        withdrawalRs.rowCount !== 1
      ) {
        throw new Error(
          "WITHDRAWAL_NOT_FOUND"
        );
      }

      const withdrawal =
        withdrawalRs.rows[0];

      if (
        withdrawal.status !==
        "PENDING"
      ) {
        throw new Error(
          "INVALID_STATUS"
        );
      }

      vlog(
        "RESERVE_BALANCE"
      );

      await reserveWalletBalance(
        withdrawal.user_id,
        Number(
          withdrawal.amount
        ),
        client
      );

      vlog(
        "CREATE_JOURNAL"
      );

      await createWalletJournal({

        client,

        ownerId:
          withdrawal.user_id,

        ownerType:
          "SELLER",

        refId:
          withdrawalId,

        refTable:
          "wallet_withdrawals",

        entryType:
          "SELLER_WITHDRAW",

        direction:
          "DEBIT",

        amount:
          Number(
            withdrawal.amount
          ),

        note:
          "Withdraw reserved",

        metadata: {
          stage:
            "APPROVED",
        },

        eventHash:
          createHash("sha256")
            .update(
              `${withdrawalId}:WITHDRAW_RESERVED`
            )
            .digest("hex"),
      });

      vlog(
        "CREATE_SETTLEMENT_EVENT"
      );

      await createWithdrawalSettlementEventOnce(
        {

          withdrawalId,

          eventType:
            WithdrawalSettlementEvents.WITHDRAW_APPROVED,

          source:
            "wallet.withdraw",

          reason:
            "Withdrawal approved",

          metadata: {},

        },
        client
      );

      const updateRs =
        await client.query(
          `
          UPDATE wallet_withdrawals
          SET

            status = 'APPROVED',

            approved_by = $2,

            approved_at = NOW()

          WHERE id = $1
          `,
          [
            withdrawalId,
            adminId,
          ]
        );

      if (
        updateRs.rowCount !== 1
      ) {
        throw new Error(
          "WITHDRAWAL_APPROVE_FAILED"
        );
      }

      vlog(
        "APPROVE_DONE",
        {
          withdrawalId,
        }
      );
    }
  );
}
