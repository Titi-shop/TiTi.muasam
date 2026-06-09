import { NextResponse } from "next/server";
import {
  getSellerAddresses,
  createSellerAddress,
} from "@/lib/db/sellerAddresses";

export async function GET(req: Request) {
  const sellerId =
    req.headers.get("x-seller-id") || "demo-seller";

  const data = await getSellerAddresses(sellerId);

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();

  const sellerId =
    req.headers.get("x-seller-id") || "demo-seller";

  const data = await createSellerAddress({
    ...body,
    seller_id: sellerId,
  });

  return NextResponse.json(data);
}
