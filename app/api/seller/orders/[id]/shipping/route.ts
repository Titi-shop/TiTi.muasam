import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/* =========================
   HELPERS
========================= */
function headers() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

/* =========================================================
   PATCH /api/seller/orders/[id]/shipping
   - Seller bắt đầu giao hàng
========================================================= */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  /* 1️⃣ AUTH (NETWORK–FIRST) */
  const user = await getUserFromBearer();
  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  /* 2️⃣ RBAC */
  const role = await resolveRole(user);
  if (role !== "seller" && role !== "admin") {
    return NextResponse.json(
      { error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const orderId = params.id;

  try {
    /* 3️⃣ Lấy order hiện tại */
    const orderRes = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=id,status`,
      { headers: headers(), cache: "no-store" }
    );

    if (!orderRes.ok) {
      const err = await orderRes.text();
      throw new Error("FETCH_ORDER_FAILED: " + err);
    }

    const orders: Array<{ id: string; status: string }> =
      await orderRes.json();

    if (orders.length === 0) {
      return NextResponse.json(
        { error: "ORDER_NOT_FOUND" },
        { status: 404 }
      );
    }

    const order = orders[0];

    /* 4️⃣ Chỉ cho phép confirmed → shipping */
    if (order.status !== "confirmed") {
      return NextResponse.json(
        { error: "INVALID_STATUS_TRANSITION" },
        { status: 400 }
      );
    }

    /* 5️⃣ Update status sang shipping */
    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`,
      {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ status: "shipping" }),
      }
    );

    if (!updateRes.ok) {
      const err = await updateRes.text();
      throw new Error("UPDATE_FAILED: " + err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ START SHIPPING ERROR:", err);
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
