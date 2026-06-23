import { NextResponse } from "next/server";

import {
  getA2UPayment,
  completeA2UPayment,
} from "@/lib/pi/pi.a2u";

import {
  getProcessingWithdrawals,
  markWithdrawalCompleted,
  markWithdrawalFailed,
} from "@/lib/db/wallet/wallet.withdraw";

export const runtime = "nodejs";

export const dynamic =
  "force-dynamic";

function vlog(
  step: string,
  data?: unknown
) {
  console.log(
    `[WITHDRAW_VERIFY][${step}]`,
    data ?? ""
  );
}

export async function POST() {
  try {
    vlog("START");

    const withdrawals =
      await getProcessingWithdrawals();

    vlog(
      "PROCESSING_COUNT",
      withdrawals.length
    );

    let completed = 0;

    for (const withdrawal of withdrawals) {
      try {
        if (
          !withdrawal.pi_payment_id
        ) {
          continue;
        }

        vlog(
          "CHECK_PAYMENT",
          {
            withdrawalId:
              withdrawal.id,
            paymentId:
              withdrawal.pi_payment_id,
          }
        );

        const payment =
          await getA2UPayment(
            withdrawal.pi_payment_id
          );

        vlog(
          "PAYMENT_STATUS",
          {
            withdrawalId:
              withdrawal.id,
            status:
              payment.status,
          }
        );

        if (
          payment.status
            ?.cancelled ||
          payment.status
            ?.user_cancelled
        ) {
          await markWithdrawalFailed(
            withdrawal.id,
            "PAYMENT_CANCELLED"
          );

          continue;
        }

        if (
          !payment.status
            ?.transaction_verified
        ) {
          vlog(
            "WAITING_VERIFY",
            {
              withdrawalId:
                withdrawal.id,
            }
          );

          continue;
        }

        const txid =
          payment.transaction
            ?.txid;

        if (!txid) {
          vlog(
            "TXID_MISSING",
            {
              withdrawalId:
                withdrawal.id,
            }
          );

          continue;
        }

        if (
          !payment.status
            ?.developer_completed
        ) {
          vlog(
            "COMPLETE_PI_PAYMENT",
            {
              withdrawalId:
                withdrawal.id,
              paymentId:
                withdrawal.pi_payment_id,
            }
          );

          await completeA2UPayment(
            withdrawal.pi_payment_id,
            txid
          );
        }

        await markWithdrawalCompleted(
          withdrawal.id,
          txid
        );

        completed++;

        vlog(
          "WITHDRAW_COMPLETED",
          {
            withdrawalId:
              withdrawal.id,
            txid,
          }
        );
      } catch (error) {
        console.error(
          "[WITHDRAW_VERIFY][ITEM_ERROR]",
          error
        );
      }
    }

    vlog(
      "DONE",
      {
        completed,
      }
    );

    return NextResponse.json({
      success: true,
      completed,
      scanned:
        withdrawals.length,
    });
  } catch (error) {
    console.error(
      "[WITHDRAW_VERIFY][ERROR]",
      error
    );

    return NextResponse.json(
      {
        error:
          "VERIFY_FAILED",
      },
      {
        status: 500,
      }
    );
  }
}
