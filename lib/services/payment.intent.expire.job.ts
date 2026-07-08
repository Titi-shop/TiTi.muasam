// =====================================================
// lib/services/payment.intent.expire.job.ts
// =====================================================

import {
  withTransaction,
} from "@/lib/db";

import {
  findExpiredPaymentIntents,
  expirePaymentIntentFlow,
} from "@/lib/db/payments.intent";
import {
  logger,
  maskId,
} from "@/lib/logger";

export async function processPaymentIntentExpireJob() {

  logger.info(
  "PAYMENT_INTENT_JOB.START"
);

  try {

    return await withTransaction(
      async (client) => {

        logger.debug(
  "PAYMENT_INTENT_JOB.TX_BEGIN"
);

        /* =============================================
           FIND EXPIRED PAYMENT INTENTS
        ============================================= */

        const intents =
          await findExpiredPaymentIntents(
            client
          );

        logger.info(
  "PAYMENT_INTENT_JOB.FOUND",
  {
    total: intents.length,
  }
);

        if (
          !intents.length
        ) {

          logger.debug(
  "PAYMENT_INTENT_JOB.NOTHING_TO_PROCESS"
);

          return {
            success: true,
            processed: 0,
          };
        }

        /* =============================================
           PROCESS LOOP
        ============================================= */

        for (const intent of intents) {

          logger.info(
  "PAYMENT_INTENT_JOB.PROCESS_START",
  {
    paymentIntentId: maskId(intent.id),
  }
);

          try {

            await expirePaymentIntentFlow({
              client,
              intent,
            });

            logger.info(
  "PAYMENT_INTENT_JOB.PROCESS_SUCCESS",
  {
    paymentIntentId: maskId(intent.id),
  }
);

          } catch (error) {

            logger.error(
  "PAYMENT_INTENT_JOB.PROCESS_FAILED",
  {
    paymentIntentId: maskId(intent.id),
    message:
      error instanceof Error
        ? error.message
        : "UNKNOWN_ERROR",
  }
);

            throw error;
          }
        }

        logger.info(
  "PAYMENT_INTENT_JOB.COMPLETE",
  {
    processed: intents.length,
  }
);

        return {
          success: true,
          processed:
            intents.length,
        };
      }
    );

  } catch (error) {

    logger.error(
  "PAYMENT_INTENT_JOB.FATAL",
  {
    message:
      error instanceof Error
        ? error.message
        : "UNKNOWN_ERROR",
  }
);

    throw error;
  }
}
