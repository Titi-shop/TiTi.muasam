import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { getOrdersCountByBuyer } from "@/lib/db/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   GET /api/orders/count
========================= */
export async function GET() {
  const user = await getUserFromBearer();

  console.log("USER:", user); // 👈 thêm dòng này

  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const counts = await getOrdersCountByBuyer(user.pi_uid);

  console.log("COUNTS:", counts); // 👈 thêm dòng này

  return NextResponse.json(counts);
}
