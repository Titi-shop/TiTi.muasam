import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";
import { getOrderDetailBySeller } from "@/lib/db/orders";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
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
    return NextResponse.json(
      { error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  try {
    const order = await getOrderDetailBySeller(
      user.pi_uid,
      params.id
    );

    if (!order) {
      return NextResponse.json(
        { error: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (err) {
    console.error("ORDER DETAIL ERROR:", err);
    return NextResponse.json(
      { error: "FAILED" },
      { status: 500 }
    );
  }
}
