import {
  NextResponse,
} from "next/server";

import {
  getProductDetailService,
} from "@/lib/services/products/detail";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export async function GET(
  req: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const { id } =
    await context.params;

  const result =
    await getProductDetailService(
      id
    );

  return NextResponse.json(
    result
  );
}
