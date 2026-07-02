import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/guard";
import { cancelReturnByBuyer } from "@/lib/db/returns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =====================================================
   HELPERS
===================================================== */

function isValidUuid(value: string): boolean {
  return /^[0-9a-f-]{36}$/i.test(value);
}

function errorJson(
  code: string,
  status = 400
) {
  return NextResponse.json(
    { error: code },
    { status }
  );
}

/* =====================================================
   PATCH /api/returns/:id/cancel
===================================================== */

export async function PATCH(
  _req: Request,
  {
    params,
  }: {
    params: {
      id: string;
    };
  }
) {
  console.log(
    "[RETURN][CANCEL][API] START"
  );

  try {

    /* ================= AUTH ================= */

    const auth =
      await requireAuth();

    if (!auth.ok) {
      return auth.response;
    }

    const buyerId =
      auth.userId;

    const returnId =
      params.id;

    /* ================= VALIDATE ================= */

    if (
      !isValidUuid(returnId)
    ) {
      return errorJson(
        "INVALID_RETURN_ID"
      );
    }

    console.log(
      "[RETURN][CANCEL][INPUT]",
      {
        returnId,
        buyerId,
      }
    );

    /* ================= CANCEL ================= */

    const success =
      await cancelReturnByBuyer(
        returnId,
        buyerId
      );

    console.log(
      "[RETURN][CANCEL][RESULT]",
      success
    );

    if (!success) {
      return errorJson(
        "RETURN_NOT_CANCELABLE",
        400
      );
    }

    return NextResponse.json({
      success: true,
    });

  } catch (err) {

    console.error(
      "[RETURN][CANCEL][ERROR]",
      {
        message:
          err instanceof Error
            ? err.message
            : "UNKNOWN",
      }
    );

    const message =
      err instanceof Error
        ? err.message
        : "INTERNAL_ERROR";

    switch (message) {

      case "INVALID_INPUT":
      case "RETURN_NOT_CANCELABLE":
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
}
