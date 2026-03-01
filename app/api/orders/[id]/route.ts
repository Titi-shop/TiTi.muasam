import { NextRequest, NextResponse } from "next/server";
import { getOrderByIdForBuyer } from "@/lib/db/orders";
import { getPiUserFromRequest } from "@/lib/auth"; // nếu bạn có

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getPiUserFromRequest(req);

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const order = await getOrderByIdForBuyer(
    params.id,
    user.pi_uid
  );

  if (!order) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json(order);
}
