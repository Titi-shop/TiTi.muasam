// =====================================================
// lib/payments/a2u.orchestrator.ts
// =====================================================

import {
  getUserById,
} from "@/lib/db/users";

import {
  verifyWithdrawalRpc,
} from "@/lib/db/payments.rpc.a2u";

import {
  getWalletWithdrawalById,
  markWithdrawalCompleted,
} from "@/lib/db/wallet/wallet.withdraw";

import {
  markWithdrawalFailed,
} from "@/lib/db/wallet/wallet.withdraw.failed";

import {
  markWithdrawalProcessing,
} from "@/lib/db/wallet/wallet.withdraw.processing";

import {
  createA2UPayment,
  submitA2UPayment,
  completeA2UPayment,
} from "@/lib/pi/pi.a2u";

import {
  logger,
  maskId,
} from "@/lib/logger";

/* =====================================================
   TYPES
===================================================== */

type PayWithdrawalResult = {

  withdrawalId: string;

  piPaymentId: string;

  txid: string;

};

/* =====================================================
   PAY WITHDRAWAL
===================================================== */

export async function payWithdrawal(
  withdrawalId: string
): Promise<PayWithdrawalResult> {

  let canRollback =
    false;

  try {

    logger.info(
      "A2U.START",
      {
        withdrawalId:
          maskId(
            withdrawalId
          ),
      }
    );

    /* ===============================================
       LOAD WITHDRAWAL
    =============================================== */

    const withdrawal =
      await getWalletWithdrawalById(
        withdrawalId
      );

    if (!withdrawal) {

      throw new Error(
        "WITHDRAWAL_NOT_FOUND"
      );

    }

    switch (
      withdrawal.status
    ) {

      case "PROCESSING":

        throw new Error(
          "WITHDRAWAL_ALREADY_PROCESSING"
        );

      case "COMPLETED":

        throw new Error(
          "WITHDRAWAL_ALREADY_COMPLETED"
        );

      case "APPROVED":

      case "FAILED":

        break;

      default:

        throw new Error(
          "INVALID_STATUS"
        );

    }

    /* ===============================================
       LOAD USER
    =============================================== */

    const user =
      await getUserById(
        withdrawal.user_id
      );

    if (
      !user?.pi_uid
    ) {

      throw new Error(
        "USER_PI_UID_MISSING"
      );

    }

    /* ===============================================
       CREATE PI PAYMENT
    =============================================== */

    const piPaymentId =
      await createA2UPayment({

        uid:
          user.pi_uid,

        amount:
          Number(
            withdrawal.amount
          ),

        memo:
          `Withdraw ${withdrawal.id}`,

        metadata: {

          withdrawal_id:
            withdrawal.id,

        },

      });
        /* ===============================================
       MARK PROCESSING
    =============================================== */

    await markWithdrawalProcessing(

      withdrawal.id,

      piPaymentId,

      `Withdraw ${withdrawal.id}`,

      user.pi_uid,

    );

    canRollback =
      true;

    logger.info(
      "A2U.PROCESSING",
      {
        withdrawalId:
          maskId(
            withdrawal.id
          ),
      }
    );

    /* ===============================================
       SUBMIT
    =============================================== */

    const tx =
      await submitA2UPayment(
        piPaymentId
      );

    /* ===============================================
       COMPLETE
    =============================================== */

    await completeA2UPayment(

      piPaymentId,

      tx.txid,

    );

    /* ===============================================
       VERIFY RPC
    =============================================== */

    await verifyWithdrawalRpc(

      withdrawal.id,

      tx.txid,

    );

    logger.info(
      "A2U.RPC_OK",
      {
        withdrawalId:
          maskId(
            withdrawal.id
          ),
      }
    );

    /* ===============================================
       COMPLETE WITHDRAWAL
    =============================================== */

    await markWithdrawalCompleted(
      withdrawal.id
    );

    canRollback =
      false;

    logger.info(
      "A2U.COMPLETED",
      {
        withdrawalId:
          maskId(
            withdrawal.id
          ),
      }
    );

    /* ===============================================
       SUCCESS
    =============================================== */

    const result:
      PayWithdrawalResult = {

      withdrawalId:
        withdrawal.id,

      piPaymentId,

      txid:
        tx.txid,

    };

    logger.info(
      "A2U.SUCCESS",
      {
        withdrawalId:
          maskId(
            withdrawal.id
          ),
      }
    );

    return result;

  } catch (
    error
  ) {
        const message =
      error instanceof Error
        ? error.message
        : "UNKNOWN_ERROR";

    /* ===============================================
       ROLLBACK
    =============================================== */

    if (
      canRollback
    ) {

      try {

        const latest =
          await getWalletWithdrawalById(
            withdrawalId
          );

        if (
          latest?.status ===
          "PROCESSING"
        ) {

          await markWithdrawalFailed(

            withdrawalId,

            message,

          );

          logger.warn(
            "A2U.ROLLBACK",
            {
              withdrawalId:
                maskId(
                  withdrawalId
                ),
            }
          );

        } else {

          logger.warn(
            "A2U.SKIP_ROLLBACK",
            {
              withdrawalId:
                maskId(
                  withdrawalId
                ),
              status:
                latest?.status ??
                "UNKNOWN",
            }
          );

        }

      } catch (
        rollbackError
      ) {

        logger.error(
          "A2U.ROLLBACK_FAILED",
          {
            withdrawalId:
              maskId(
                withdrawalId
              ),
            message:
              rollbackError instanceof Error
                ? rollbackError.message
                : "UNKNOWN_ERROR",
          }
        );

        if (
          process.env.NODE_ENV !==
          "production"
        ) {

          console.error(
            rollbackError
          );

        }

      }

    }

    logger.error(
      "A2U.FAILED",
      {
        withdrawalId:
          maskId(
            withdrawalId
          ),
        message,
      }
    );

    throw error;

  }

}
