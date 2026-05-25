import { NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/guard";
import { getSellerProducts } from "@/lib/db/products";
import { getProfileByUserId } from "@/lib/db/userProfiles";
import type {
  ProductRecord,
} from "@/types/Product";
export const runtime = "nodejs";
export const dynamic =
  "force-dynamic";

/* =========================================================
   RESPONSE TYPES
========================================================= */

type SellerProductItem = {
  id: string;
  name: string;
  price: number;
  sale_price: number | null;
  sale_start: string | null;
  sale_end: string | null;
  min_price?: number;
  min_sale_price?: number | null;
  thumbnail: string | null;
  images: string[];
  stock: number;
  sold: number;
  rating_avg: number;
  is_active: boolean;
  status: string;
  created_at: string;
  updated_at: string;
};

type SellerProfile = {
  shop_name: string | null;
  shop_banner: string | null;
  avatar_url: string | null;
  shop_description: string | null;
  rating: number;
  total_reviews: number;
  total_sales: number;
};

type SellerProductsResponse = {
  profile: SellerProfile | null;
  products: SellerProductItem[];
};

/* =========================================================
   HELPERS
========================================================= */

function mapProduct(
  product: ProductRecord
): SellerProductItem {
  return {
    id: product.id,

    name: product.name,

    price: Number(
      product.price ?? 0
    ),

    sale_price:
      product.sale_price !==
      null
        ? Number(
            product.sale_price
          )
        : null,

    sale_start:
      product.sale_start,

    sale_end:
      product.sale_end,

    min_price:
      typeof product.final_price ===
      "number"
        ? Number(
            product.final_price
          )
        : undefined,

    min_sale_price:
      product.sale_enabled &&
      product.sale_price !==
        null
        ? Number(
            product.sale_price
          )
        : null,

    thumbnail:
      product.thumbnail ??
      null,

    images:
      Array.isArray(
        product.images
      )
        ? product.images
        : [],

    stock: Number(
      product.stock ?? 0
    ),

    sold: Number(
      product.sold ?? 0
    ),

    rating_avg: Number(
      product.rating_avg ??
        0
    ),

    is_active:
      Boolean(
        product.is_active
      ),

    status:
      product.status,

    created_at:
      product.created_at,

    updated_at:
      product.updated_at,
  };
}

/* =========================================================
   GET
========================================================= */

export async function GET() {
  try {
    const auth =
      await requireSeller();

    if (!auth.ok) {
      return auth.response;
    }

    const userId =
      auth.userId;

    /* ================= PRODUCTS ================= */

    const rawProducts =
      await getSellerProducts(
        userId
      );

    const products =
      rawProducts.map(
        (
          product
        ): SellerProductItem =>
          mapProduct(
            product as ProductRecord
          )
      );

    /* ================= PROFILE ================= */

    const profileData =
      await getProfileByUserId(
        userId
      );

    const profile: SellerProfile =
      {
        shop_name:
          profileData?.shop_name ??
          null,

        shop_banner:
          profileData?.shop_banner ??
          null,

        avatar_url:
          profileData?.avatar_url ??
          null,

        shop_description:
          profileData?.shop_description ??
          null,

        rating: Number(
          profileData?.rating ??
            0
        ),

        total_reviews:
          Number(
            profileData?.total_reviews ??
              0
          ),

        total_sales:
          Number(
            profileData?.total_sales ??
              0
          ),
      };

    const response: SellerProductsResponse =
      {
        profile,

        products,
      };

    return NextResponse.json(
      response
    );
  } catch (error) {
    console.error(
      "[SELLER_PRODUCTS_GET]",
      error
    );

    const fallback: SellerProductsResponse =
      {
        profile: null,

        products: [],
      };

    return NextResponse.json(
      fallback,
      {
        status: 200,
      }
    );
  }
}
