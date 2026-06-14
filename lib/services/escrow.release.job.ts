// =====================================================
// lib/services/escrow.release.job.ts
// =====================================================

import {
  withTransaction,
} from "@/lib/db";

import {
  findReleasableEscrows,
  releaseEscrowFlow,
} from "@/lib/db/settlement";

export async function processEscrowReleaseJob() {

  return withTransaction(
    async (client) => {

      const escrows =
        await findReleasableEscrows(
          client
        );

      for (const escrow of escrows) {

        await releaseEscrowFlow({
          client,
          escrow,
        });
      }

      return {
        success: true,
        processed: escrows.length,
      };
    }
  );
}
