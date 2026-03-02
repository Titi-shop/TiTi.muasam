/* lib/db/products.ts */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // 🔥 BẮT BUỘC

if (!SUPABASE_URL) {
  throw new Error("❌ NEXT_PUBLIC_SUPABASE_URL is missing");
}

if (!SERVICE_KEY) {
  throw new Error("❌ SUPABASE_SERVICE_ROLE_KEY is missing");
}

/* =========================
   TYPES
========================= */

export type ProductRecord = {
  id: string;

  name: string;
  slug: string;

  short_description: string;
  description: string;
  detail: string;

  thumbnail: string | null;
  images: string[];
  detail_images: string[];

  video_url: string | null;

  price: number;
  sale_price: number | null;
  currency: string;

  stock: number;
  is_unlimited: boolean;

  category_id: number | null;

  seller_id: string;

  views: number;
  sold: number;

  rating_avg: number;
  rating_count: number;

  status: "draft" | "active" | "inactive" | "archived" | "banned";

  is_featured: boolean;
  is_digital: boolean;

  sale_start: string | null;
  sale_end: string | null;

  meta_title: string | null;
  meta_description: string | null;

  deleted_at: string | null;

  created_at: string;
  updated_at: string | null;
};
/* =========================
   COMMON HEADERS
========================= */
function supabaseHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

/* =========================
   GET — ALL PRODUCTS (PUBLIC)
========================= */

export async function getAllProducts(): Promise<ProductRecord[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/products?status=eq.active&select=*`,
    {
      headers: supabaseHeaders(),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ SUPABASE GET PRODUCTS ERROR:", text);
    throw new Error("FAILED_TO_FETCH_PRODUCTS");
  }

  const raw = (await res.json()) as ProductRecord[];

  return raw.map((p): ProductRecord => ({
    ...p,
    price: Number((p.price / 100).toFixed(2)),
    sale_price:
      p.sale_price !== null
        ? Number((p.sale_price / 100).toFixed(2))
        : null,
  }));
}
/* =========================
   GET — PRODUCTS BY SELLER
   sellerPiUid = users.pi_uid
========================= */
export async function getSellerProducts(
  sellerPiUid: string
): Promise<ProductRecord[]> {
  const res = await fetch(
  `${SUPABASE_URL}/rest/v1/products?seller_id=eq.${sellerPiUid}&status=eq.active&select=*`,
  {
    headers: supabaseHeaders(),
    cache: "no-store",
  }
);

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ SUPABASE SELLER PRODUCTS ERROR:", text);
    throw new Error("FAILED_TO_FETCH_SELLER_PRODUCTS");
  }

  return (await res.json()) as ProductRecord[];
}

/* =========================
   POST — CREATE PRODUCT
   sellerPiUid = users.pi_uid
========================= */
export async function createProduct(
  sellerPiUid: string,
  product: Omit<
    ProductRecord,
    "id" | "seller_id" | "created_at" | "updated_at"
  >
): Promise<ProductRecord> {

  const priceNumber = Number(product.price);
  if (Number.isNaN(priceNumber)) {
    throw new Error("INVALID_PRICE");
  }

  const salePriceNumber =
    product.sale_price !== null && product.sale_price !== undefined
      ? Number(product.sale_price)
      : null;

  if (
    salePriceNumber !== null &&
    Number.isNaN(salePriceNumber)
  ) {
    throw new Error("INVALID_SALE_PRICE");
  }

  const payload = {
    ...product,
    price: Math.round(priceNumber * 100), // 🔥 convert to minor unit
    sale_price:
      salePriceNumber !== null
        ? Math.round(salePriceNumber * 100)
        : null,
    seller_id: sellerPiUid,
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(),
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ SUPABASE CREATE PRODUCT ERROR:", text);
    throw new Error("FAILED_TO_CREATE_PRODUCT");
  }

  const data = await res.json();
  return data[0];
}
/* =========================
   PUT — UPDATE PRODUCT BY SELLER
   sellerPiUid = users.pi_uid
========================= */
export async function updateProductBySeller(
  sellerPiUid: string,
  productId: string,
  data: {
    name: string;
    price: number;
    description?: string;
    images?: string[];
    category_id?: number | null;
    sale_price?: number | null;
    sale_start?: string | null;
    sale_end?: string | null;
  }
): Promise<boolean> {

  const priceNumber = Number(data.price);
  if (Number.isNaN(priceNumber)) {
    throw new Error("INVALID_PRICE");
  }

  const salePriceNumber =
    data.sale_price !== null && data.sale_price !== undefined
      ? Number(data.sale_price)
      : null;

  if (
    salePriceNumber !== null &&
    Number.isNaN(salePriceNumber)
  ) {
    throw new Error("INVALID_SALE_PRICE");
  }

  const payload = {
    ...data,
    price: Math.round(priceNumber * 100),
    sale_price:
      salePriceNumber !== null
        ? Math.round(salePriceNumber * 100)
        : null,
  };

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/products?id=eq.${productId}&seller_id=eq.${sellerPiUid}`,
    {
      method: "PATCH",
      headers: {
        ...supabaseHeaders(),
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ SUPABASE UPDATE PRODUCT ERROR:", text);
    throw new Error("FAILED_TO_UPDATE_PRODUCT");
  }

  return true;
}
/* =========================
   DELETE — SOFT DELETE BY SELLER
========================= */
export async function deleteProductBySeller(
  sellerPiUid: string,
  productId: string
): Promise<boolean> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/products?id=eq.${productId}&seller_id=eq.${sellerPiUid}`,
    {
      method: "DELETE",
      headers: {
        ...supabaseHeaders(),
        Prefer: "return=representation",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ DELETE PRODUCT ERROR:", text);
    throw new Error("FAILED_TO_DELETE_PRODUCT");
  }

  const deleted = await res.json();
  console.log("Deleted rows:", deleted);

  return deleted.length > 0;
}

