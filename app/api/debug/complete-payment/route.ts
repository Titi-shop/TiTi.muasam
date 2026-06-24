// app/api/debug/complete-payment/route.ts

import { NextResponse } from "next/server";
import {
  completeA2UPayment,
} from "@/lib/pi/pi.a2u";

export async function GET() {
  try {
    await completeA2UPayment(
      "MJyx1oJzbtLxkUYi5cJoLkQ86WEV",
      "8c527c6b07cc3e8a00a19a9cf5c6d61be7b22fb4cbcd9f6465a3c4abb101bb4b"
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
