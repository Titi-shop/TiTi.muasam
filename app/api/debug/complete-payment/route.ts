// app/api/debug/complete-payment/route.ts

import { NextResponse } from "next/server";
import {
  completeA2UPayment,
} from "@/lib/pi/pi.a2u";

export async function GET() {
  try {
    await completeA2UPayment(
      "Tc6n4ObpTo4KDBlC4FGxXuWoRDzr",
      "e3ec222721c24911167a0c4bdeb63a09e6796f6a437c379c0b4a238ae750e119"
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
