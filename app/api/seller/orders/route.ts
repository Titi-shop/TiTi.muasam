import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";
import { getOrdersBySeller } from "@/lib/db/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SELLER STATUS = tổng hợp từ order_items.status
 */
function resolveSellerStatus(
  items: Array<{ status?: string }>
):
  | "pending"
  | "confirmed"
  | "shipping"
  | "completed"
  | "cancelled" {
  if (items.some((i) => i.status === "pending")) return "pending";
  if (items.some((i) => i.status === "confirmed")) return "confirmed";
  if (items.some((i) => i.status === "shipping")) return "shipping";
  if (items.every((i) => i.status === "completed"))
    return "completed";
  return "cancelled";
}

export async function GET() {
  /* =========================
     AUTH
  ========================= */
  const user = await getUserFromBearer();
  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  /* =========================
     RBAC
  ========================= */
  const role = await resolveRole(user);
  if (role !== "seller" && role !== "admin") {
    return NextResponse.json([], { status: 200 });
  }

  try {
    const orders = await getOrdersBySeller(user.pi_uid);

    /* =========================
       MAP SELLER STATUS
    ========================= */
    const normalized = orders.map((o) => ({
      ...o,
      seller_status: resolveSellerStatus(
        o.order_items.map((i) => ({
          status: (i as { status?: string }).status,
        }))
      ),
    }));

    return NextResponse.json(normalized);
  } catch (err) {
    console.warn("SELLER ORDERS WARN:", err);
    return NextResponse.json([], { status: 200 });
  }
}
