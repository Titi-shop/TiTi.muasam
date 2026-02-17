import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";

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
  req: Request,
  { params }: { params: { id: string } }
) {
  /* 1️⃣ AUTH */
  const user = await getUserFromBearer();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const orderId = params.id;

  try {
    /* 2️⃣ Buyer xác nhận đã nhận hàng → shipping → completed */
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&status=eq.shipping`,
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
      throw new Error(err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ BUYER CONFIRM ERROR:", err);
    return NextResponse.json({ error: "FAILED" }, { status: 500 });
  }
}
