import { NextResponse } from "next/server";

import {
  getHomeService,
} from "@/lib/services/home";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   GET HOME
========================================================= */

export async function GET() {
  const t0 = performance.now();

  const result =
    await getHomeService();

  console.log(
    "[API][HOME][GET_DONE]",
    {
      duration_ms:
        Math.round(
          performance.now() - t0
        ),
    }
  );

  return NextResponse.json(
    result
  );
}
