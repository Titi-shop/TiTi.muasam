import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function headers() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

/* =========================================================
   PATCH /api/seller/orders/[id]/confirm-items
   - Seller xác nhận đơn (order_items)
========================================================= */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromBearer();
  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  const role = await resolveRole(user);
  if (role !== "seller" && role !== "admin") {
    return NextResponse.json(
      { error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const orderId = params.id;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${orderId}&seller_pi_uid=eq.${user.pi_uid}&status=eq.pending`,
      {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ status: "confirmed" }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ CONFIRM ITEMS ERROR:", err);
    return NextResponse.json(
      { error: "FAILED" },
      { status: 500 }
    );
  }
}
