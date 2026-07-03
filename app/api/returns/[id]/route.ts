import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/guard";

import {
  getReturnDetail,
  updateReturnStatus,
} from "@/lib/services/returns/buyer.service";

export const runtime = "nodejs";

/* =====================================================
   HELPERS
===================================================== */

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
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

function mapError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "INTERNAL_ERROR";

  switch (message) {
    case "RETURN_NOT_FOUND":
      return errorJson(
        message,
        404
      );

    case "RETURN_NOT_CANCELABLE":
    case "INVALID_STATE":
    case "TRACKING_REQUIRED":
    case "INVALID_ACTION":
    case "INVALID_INPUT":
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

export async function GET(
  _req: NextRequest,
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
      await requireAuth();

    if (!auth.ok) {
      return auth.response;
    }

    if (
      !isValidUuid(
        params.id
      )
    ) {
      return errorJson(
        "INVALID_UUID"
      );
    }

    const item =
      await getReturnDetail(
        auth.userId,
        params.id
      );

    if (!item) {
      return errorJson(
        "RETURN_NOT_FOUND",
        404
      );
    }

    return NextResponse.json(
      item
    );

  } catch (error) {
    return mapError(error);
  }
}

/* =====================================================
   PATCH
===================================================== */

export async function PATCH(
  req: NextRequest,
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
      await requireAuth();

    if (!auth.ok) {
      return auth.response;
    }

    if (
      !isValidUuid(
        params.id
      )
    ) {
      return errorJson(
        "INVALID_UUID"
      );
    }

    const body =
      await req.json();

    await updateReturnStatus(
      auth.userId,
      params.id,
      body
    );

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    return mapError(error);
  }
}
