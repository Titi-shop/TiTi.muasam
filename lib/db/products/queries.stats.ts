import { query } from "@/lib/db";

import {
  safeNumber,
  log,
  logError,
  maskId,
} from "./helpers";

/* =========================================================
   INCREMENT PRODUCT VIEW
========================================================= */

export async function incrementProductView(
  productId: string
): Promise<number> {

  log(
    "INCREMENT_VIEW_START",
    {
      productId:
        maskId(
          productId
        ),
    }
  );

  try {

    const result =
      await query<{
        views: number;
      }>(
        `
        UPDATE products
        SET
          views = views + 1,
          updated_at = NOW()
        WHERE id = $1
        RETURNING views
        `,
        [productId]
      );

    if (
      result.rowCount !== 1
    ) {

      throw new Error(
        "PRODUCT_NOT_FOUND"
      );

    }

    const views =
      safeNumber(
        result.rows[0].views
      );

    log(
      "INCREMENT_VIEW_SUCCESS",
      {
        views,
      }
    );

    return views;

  } catch (error) {

    logError(
      "INCREMENT_VIEW_ERROR",
      error
    );

    throw error;

  }

}

/* =========================================================
   GET SOLD COUNT
========================================================= */

export async function getSoldByProduct(
  productId: string
): Promise<number> {

  log(
    "GET_SOLD_START",
    {
      productId:
        maskId(
          productId
        ),
    }
  );

  try {

    const result =
      await query<{
        sold: number;
      }>(
        `
        SELECT
          COALESCE(
            SUM(quantity),
            0
          ) AS sold
        FROM order_items
        WHERE product_id = $1
        `,
        [productId]
      );

    const sold =
      safeNumber(
        result.rows[0]?.sold
      );

    log(
      "GET_SOLD_SUCCESS",
      {
        sold,
      }
    );

    return sold;

  } catch (error) {

    logError(
      "GET_SOLD_ERROR",
      error
    );

    throw error;

  }

}
