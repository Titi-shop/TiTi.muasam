
/* =========================================================
   app/api/seller/orders/route.ts
   - NETWORK–FIRST Pi Auth
   - AUTH-CENTRIC + RBAC
   - BOOTSTRAP MODE (Phase 1)
   - Bearer ONLY (NO cookie)
========================================================= */

import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";
import { getOrdersBySeller } from "@/lib/db/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   TYPES
========================= */

type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "completed"
  | "cancelled"
  | "returned";  
/* =========================
   HELPERS
========================= */

function parseOrderStatus(
  value: string | null
): OrderStatus | undefined {
  if (!value) return undefined;

  const allowed: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipping",
  "cancelled",
  "completed",
  "returned", 
];
  return allowed.includes(value as OrderStatus)
    ? (value as OrderStatus)
    : undefined;
}

/* =========================================================
   GET /api/seller/orders
   BOOTSTRAP RULE:
   - Not seller yet => return []
========================================================= */
export async function GET() {
  try {
    /* 1️⃣ AUTH */
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
      return NextResponse.json([], { status: 200 });
    }

    /* 3️⃣ FETCH FULL PRODUCT ROW */
    const products = await getSellerProducts(
      user.pi_uid
    );

    return NextResponse.json(products);
  } catch (err) {
    console.warn("SELLER PRODUCTS WARN:", err);
    return NextResponse.json([], { status: 200 });
  }
}
