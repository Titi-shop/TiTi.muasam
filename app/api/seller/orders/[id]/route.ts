import { NextRequest, NextResponse } from "next/server";
import { getOrderByIdForSeller } from "@/lib/db/orders";

const PI_API_BASE = "https://api.minepi.com/v2";

interface PiUser {
  uid: string;
  username: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    /* 🔐 VERIFY TOKEN VỚI PI */
    const piRes = await fetch(`${PI_API_BASE}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!piRes.ok) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const piUser = (await piRes.json()) as PiUser;

    /* 📦 LOAD ORDER */
    const order = await getOrderByIdForSeller(
      params.id,
      piUser.uid
    );

    if (!order) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
