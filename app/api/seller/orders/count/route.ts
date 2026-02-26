import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { getSellerOrdersCount } from "@/lib/db/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUserFromBearer();

  if (!user || user.role !== "seller") {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const stats = await getSellerOrdersCount(user.pi_uid);

  return NextResponse.json(stats);
}
