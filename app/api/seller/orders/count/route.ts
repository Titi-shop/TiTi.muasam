import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";
import { getSellerOrdersCount } from "@/lib/db/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  /* 1️⃣ AUTH */
  const user = await getUserFromBearer();
  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  /* 2️⃣ RBAC — giống hệt route orders */
  const role = await resolveRole(user);

  if (role !== "seller" && role !== "admin") {
    return NextResponse.json(
      { error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  /* 3️⃣ DB */
  try {
    const stats = await getSellerOrdersCount(user.pi_uid);
    return NextResponse.json(stats);
  } catch (err) {
    console.warn("SELLER COUNT WARN:", err);

    return NextResponse.json(
      {
        pending: 0,
        confirmed: 0,
        shipping: 0,
        completed: 0,
        returned: 0,
        cancelled: 0,
        total: 0,
      },
      { status: 200 }
    );
  }
}
