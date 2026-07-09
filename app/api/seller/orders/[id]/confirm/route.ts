import { NextResponse } from "next/server";

import { requireSeller } from "@/lib/auth/guard";

import {
  confirmOrderBySeller,
} from "@/lib/db/orders.seller";

import {
  logger,
} from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidId(
  v: unknown
): v is string {
  return (
    typeof v === "string" &&
    v.length > 10
  );
}

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: {
      id: string;
    };
  }
) {
  try {

    const auth =
      await requireSeller();

    if (!auth.ok) {
      return auth.response;
    }

    const orderId =
      params?.id;

    if (
      !isValidId(orderId)
    ) {

      logger.warn(
        "ORDER.CONFIRM.INVALID_ID"
      );

      return NextResponse.json(
        {
          error:
            "INVALID_ORDER_ID",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      await req
        .json()
        .catch(() => ({}));

    const sellerMessage =
      typeof body?.seller_message ===
      "string"
        ? body.seller_message.trim()
        : null;

    logger.info(
      "ORDER.CONFIRM.START"
    );

    const success =
      await confirmOrderBySeller(
        orderId,
        auth.userId,
        sellerMessage
      );

    if (!success) {

      logger.warn(
        "ORDER.CONFIRM.NO_UPDATE"
      );

      return NextResponse.json(
        {
          error:
            "NOTHING_TO_CONFIRM",
        },
        {
          status: 400,
        }
      );
    }

    logger.info(
      "ORDER.CONFIRM.SUCCESS"
    );

    return NextResponse.json({
      success: true,
    });

  } catch (error) {

    logger.error(
      "ORDER.CONFIRM.ERROR",
      {
        message:
          error instanceof Error
            ? error.message
            : "UNKNOWN_ERROR",
      }
    );

    return NextResponse.json(
      {
        error: "FAILED",
      },
      {
        status: 500,
      }
    );
  }
}
