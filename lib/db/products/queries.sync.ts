import { withTransaction } from "@/lib/db";

import {
  safeNumber,
  log,
  logError,
  maskId,
} from "./helpers";


/* =========================================================
   SYNC PRODUCT FROM VARIANTS
========================================================= */

export async function syncProductFromVariants(
  product_id: string
): Promise<void> {
  try {
    await withTransaction(
      async (client) => {
        log(
  "SYNC_FROM_VARIANTS_START",
  {
    productId:
      maskId(product_id),
  }
);
        const result =
          await client.query<{
            variant_count: string;
            min_price: string | null;
            total_stock: string | null;
          }>(
            `
            SELECT
              COUNT(*)::text AS variant_count,

              MIN(final_price)::text AS min_price,

              COALESCE(
                SUM(
                  CASE
                    WHEN is_unlimited
                    THEN 0
                    ELSE stock
                  END
                ),
                0
              )::text AS total_stock

            FROM product_variants

            WHERE product_id = $1
              AND deleted_at IS NULL
              AND is_active = true
            `,
            [product_id]
          );

        const row =
          result.rows[0];

        const variant_count =
          safeNumber(
            row?.variant_count
          );

        const has_variants =
          variant_count > 0;

        const min_price =
          safeNumber(
            row?.min_price
          );

        const total_stock =
          safeNumber(
            row?.total_stock
          );

        log(
          "SYNC_FROM_VARIANTS_RESULT",
          {
            variant_count,
            has_variants,
            min_price,
            total_stock,
          }
        );

        const updateResult =
  await client.query(
    `
    UPDATE products
    SET
      final_price = $2,
      stock = $3,
      has_variants = $4,
      updated_at = NOW()
    WHERE id = $1
    `,
    [
      product_id,
      min_price,
      total_stock,
      has_variants,
    ]
  );
        if (
  updateResult.rowCount !== 1
) {

  throw new Error(
    "FAILED_TO_SYNC_PRODUCT"
  );

}

        log(
  "SYNC_FROM_VARIANTS_SUCCESS",
  {
    productId:
      maskId(product_id),
  }
);
      }
    );
  } catch (error) {
    logError(
      "SYNC_FROM_VARIANTS_ERROR",
      error
    );

    throw error;
  }
}
