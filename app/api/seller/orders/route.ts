import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";
import { getOrdersBySeller } from "@/lib/db/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  /* AUTH */
  const user = await getUserFromBearer();
  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  /* RBAC */
  const role = await resolveRole(user);
  if (role !== "seller" && role !== "admin") {
    return NextResponse.json([], { status: 200 });
  }

  /* QUERY */
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;

  try {
    const orders = await getOrdersBySeller(
      user.pi_uid,
      status
    );
    return NextResponse.json(orders);
  } catch (err) {
    console.warn("SELLER ORDERS WARN:", err);
    return NextResponse.json([], { status: 200 });
  }
}
