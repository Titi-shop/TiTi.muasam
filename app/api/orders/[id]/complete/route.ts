import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";
import { getOrderByIdForSeller } from "@/lib/db/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function headers() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1️⃣ Auth: NETWORK-FIRST (Bearer only)
    const user = await getUserFromBearer();
    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json(
        { error: "INVALID_ORDER_ID" },
        { status: 400 }
      );
    }

    // 2️⃣ RBAC: role check
    const role = await resolveRole(user);

    if (role !== "seller") {
      return NextResponse.json(
        { error: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // 3️⃣ Ownership check
    const order = await getOrderByIdForSeller(user.pi_uid, orderId);

    if (!order) {
      return NextResponse.json(
        { error: "ORDER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // 4️⃣ Status transition guard
    if (order.status !== "shipping") {
      return NextResponse.json(
        { error: "INVALID_STATUS_TRANSITION" },
        { status: 400 }
      );
    }

    // 5️⃣ Update via SERVICE ROLE (RLS bypassed intentionally)
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`,
      {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({
          status: "completed",
          completed_at: new Date().toISOString(),
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("❌ SUPABASE COMPLETE ERROR:", err);
      return NextResponse.json(
        { error: "FAILED_TO_UPDATE_ORDER" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ COMPLETE ORDER ERROR:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
