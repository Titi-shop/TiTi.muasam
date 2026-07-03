import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/guard";

import {
  listBuyerReturns,
  createBuyerReturn,
} from "@/lib/services/returns/buyer.service";

export const runtime = "nodejs";

/* =====================================================
   TYPES
===================================================== */

type CreateReturnBody = {
  orderId?: string;
  orderItemId?: string;
  reason?: string;
  description?: string;
  images?: string[];
};

/* =====================================================
   HELPERS
===================================================== */

function errorJson(
  code: string,
  status = 400
) {
  return NextResponse.json(
    { error: code },
    { status }
  );
}

function mapError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "INTERNAL_ERROR";

  switch (message) {

    case "ORDER_NOT_FOUND":
    case "ITEM_NOT_FOUND":
      return errorJson(
        message,
        404
      );

    case "RETURN_EXISTS":
      return errorJson(
        message,
        409
      );

    case "ORDER_NOT_RETURNABLE":
    case "INVALID_INPUT":
    case "INVALID_REASON":
    case "INVALID_DESCRIPTION":
    case "INVALID_UUID":
        return errorJson(
          message,
          400
        );

    default:
      return errorJson(
        "INTERNAL_ERROR",
        500
      );
  }
}

/* =====================================================
   GET
===================================================== */

export async function GET() {
  try {

    const auth =
      await requireAuth();

    if (!auth.ok) {
      return auth.response;
    }

    const items =
      await listBuyerReturns(
        auth.userId
      );

    return NextResponse.json({
      items,
    });

  } catch (error) {
    return mapError(error);
  }
}

/* =====================================================
   POST
===================================================== */

export async function POST(
  req: NextRequest
) {
  try {

    const auth =
      await requireAuth();

    if (!auth.ok) {
      return auth.response;
    }

    const body =
      (await req.json()) as CreateReturnBody;

    const id =
      await createBuyerReturn(
        auth.userId,
        body
      );

    return NextResponse.json(
      {
        success: true,
        id,
      },
      {
        status: 201,
      }
    );

  } catch (error) {
    return mapError(error);
  }
}
