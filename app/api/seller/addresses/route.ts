import { NextResponse } from "next/server";
import {
  getSellerAddresses,
  createSellerAddress,
} from "@/lib/db/sellerAddresses";

import { getUserFromToken } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json([], { status: 401 });

  const data = await getSellerAddresses(user.id);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();

  const data = await createSellerAddress({
    ...body,
    seller_id: user.id,
  });

  return NextResponse.json(data);
}
