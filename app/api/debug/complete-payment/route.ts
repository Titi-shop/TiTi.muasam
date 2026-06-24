// app/api/debug/complete-payment/route.ts

import { NextResponse } from "next/server";
import {
  completeA2UPayment,
} from "@/lib/pi/pi.a2u";

export async function GET() {
  try {
    await completeA2UPayment(
      "8rpCmTOm2P2uq5iFENZ3JIiu0g1U",
      "7ee6c5f7e397e21e2ae54afa8d33df55f4b1dea7c55b12a67e214f83cdeeb732"
    );

    return NextResponse.json({
      success: true,
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json(
      {
        success: false,
        error: String(e),
      },
      {
        status: 500,
      }
    );
  }
}
