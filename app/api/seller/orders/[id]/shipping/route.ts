import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";
import { confirmOrderBySeller } from "@/lib/db/orders"; // dùng lại pattern

export async function PATCH(
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
    // update order_items của seller sang shipping
    await updateSellerOrderItemsToShipping(
      user.pi_uid,
      params.id
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ SHIPPING ERROR:", err);
    return NextResponse.json(
      { error: "FAILED" },
      { status: 500 }
    );
  }
}
