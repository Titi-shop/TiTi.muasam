/* =====================================================
   SUPABASE CONFIG
===================================================== */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * 1 Pi = 1_000_000 microPi
 * DB lưu INTEGER (microPi)
 * App hiển thị NUMBER (Pi)
 */
const PI_BASE = 1_000_000;

/* =========================
   PI CONVERTERS
========================= */
function toMicroPi(value: number): number {
  return Math.round(value * PI_BASE);
}

function fromMicroPi(value: number): number {
  return value / PI_BASE;
}

/* =========================
   HEADERS
========================= */
function headers(): HeadersInit {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

/* =========================
   TYPES
========================= */
export type OrderItemRecord = {
  product_id: string;
  quantity: number;
  price: number;
  product?: {
    id: string;
    name: string;
    images: string[];
  };
};

export type OrderRecord = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  buyer?: {
    name: string;
    phone: string;
    address: string;
    country: string | null;
  };
  order_items: OrderItemRecord[];
};

/* =====================================================
   GET ORDERS BY SELLER (MARKETPLACE SAFE)
   - KHÔNG FILTER STATUS Ở DB
   - SELLER FILTER Ở UI
===================================================== */
export async function getOrdersBySeller(
  sellerPiUid: string
): Promise<OrderRecord[]> {
  /* 1️⃣ LẤY TẤT CẢ order_id CỦA SELLER */
  const itemsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?select=order_id&seller_pi_uid=eq.${sellerPiUid}`,
    { headers: headers(), cache: "no-store" }
  );

  if (!itemsRes.ok) return [];

  const items = (await itemsRes.json()) as Array<{
    order_id: string;
  }>;

  const orderIds = Array.from(
    new Set(items.map((i) => i.order_id))
  );

  if (orderIds.length === 0) return [];

  /* 2️⃣ FETCH ORDERS + ORDER_ITEMS + PRODUCT */
  const ids = orderIds.map((id) => `"${id}"`).join(",");

  const ordersRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=in.(${ids})&order=created_at.desc&select=
      id,
      status,
      total,
      created_at,
      order_items(
        id,
        quantity,
        price,
        product_id,
        status,
        seller_pi_uid,
        products(id,name,images)
      )
    `,
    { headers: headers(), cache: "no-store" }
  );

  if (!ordersRes.ok) return [];

  const rawOrders = (await ordersRes.json()) as Array<{
    id: string;
    status: string;
    total: number;
    created_at: string;
    order_items: Array<{
      id: string;
      quantity: number;
      price: number;
      product_id: string;
      status: string;
      seller_pi_uid: string;
      products?: {
        id: string;
        name: string;
        images?: string[] | null;
      } | null;
    }>;
  }>;

  /* 3️⃣ CHỈ GIỮ ITEM CỦA SELLER HIỆN TẠI */
  return rawOrders
    .map((order) => {
      const sellerItems = order.order_items.filter(
        (item) =>
          typeof item.seller_pi_uid === "string" &&
          item.seller_pi_uid.trim().toLowerCase() ===
            sellerPiUid.trim().toLowerCase()
      );

      if (sellerItems.length === 0) return null;

      return {
        id: order.id,
        status: order.status, // status buyer (UI seller KHÔNG dùng)
        created_at: order.created_at,
        total: fromMicroPi(order.total),
        order_items: sellerItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: fromMicroPi(item.price),
          product: item.products
            ? {
                id: item.products.id,
                name: item.products.name,
                images: item.products.images ?? [],
              }
            : undefined,
        })),
      };
    })
    .filter((o): o is OrderRecord => o !== null);
}

/* =====================================================
   CREATE ORDER (WITH SHIPPING SNAPSHOT)
===================================================== */
export async function createOrderSafe({
  buyerPiUid,
  items,
  total,
  shipping,
}: {
  buyerPiUid: string;
  items: Array<{
    product_id: string;
    quantity: number;
    price: number;
    seller_pi_uid: string;
  }>;
  total: number;
  shipping: {
    name: string;
    phone: string;
    address: string;
    country?: string;
  };
}): Promise<{ id: string; status: string; total: number }> {
  /* 1️⃣ CREATE ORDER */
  const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
    method: "POST",
    headers: {
      ...headers(),
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      buyer_id: buyerPiUid,
      total: toMicroPi(total),
      status: "pending",

      // 🔥 SHIPPING SNAPSHOT
      buyer_name: shipping.name,
      buyer_phone: shipping.phone,
      buyer_address: shipping.address,
      buyer_country: shipping.country ?? null,
    }),
  });

  if (!orderRes.ok) {
    throw new Error(await orderRes.text());
  }

  const orderData = (await orderRes.json()) as Array<{
    id: string;
    status: string;
  }>;

  const order = orderData[0];
  if (!order) {
    throw new Error("ORDER_NOT_RETURNED");
  }

  /* 2️⃣ INSERT ORDER ITEMS */
  const payload = items.map((i) => ({
    order_id: order.id,
    product_id: i.product_id,
    quantity: i.quantity,
    price: toMicroPi(i.price),
    seller_pi_uid: i.seller_pi_uid,
    status: "pending",
  }));

  const itemsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    }
  );

  if (!itemsRes.ok) {
    throw new Error(await itemsRes.text());
  }

  return {
    id: order.id,
    status: order.status,
    total,
  };
}

/* =====================================================
   GET ORDER DETAIL BY SELLER (NO USERS JOIN)
===================================================== */
export async function getOrderDetailBySeller(
  sellerPiUid: string,
  orderId: string
): Promise<OrderRecord | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=
      id,
      status,
      total,
      created_at,
      buyer_name,
      buyer_phone,
      buyer_address,
      buyer_country,
      order_items(
        id,
        quantity,
        price,
        product_id,
        status,
        seller_pi_uid,
        products(id,name,images)
      )
    `,
    { headers: headers(), cache: "no-store" }
  );

  if (!res.ok) return null;

  const data = (await res.json()) as Array<{
    id: string;
    status: string;
    total: number;
    created_at: string;
    buyer_name: string;
    buyer_phone: string;
    buyer_address: string;
    buyer_country: string | null;
    order_items: Array<{
      id: string;
      quantity: number;
      price: number;
      product_id: string;
      status: string;
      seller_pi_uid: string;
      products: {
        id: string;
        name: string;
        images: string[] | null;
      } | null;
    }>;
  }>;

  const order = data[0];
  if (!order) return null;

  const sellerItems = order.order_items.filter(
    (item) =>
      item.seller_pi_uid.trim().toLowerCase() ===
      sellerPiUid.trim().toLowerCase()
  );

  if (sellerItems.length === 0) return null;

  return {
    id: order.id,
    status: order.status,
    created_at: order.created_at,
    total: fromMicroPi(order.total),
    buyer: {
      name: order.buyer_name,
      phone: order.buyer_phone,
      address: order.buyer_address,
      country: order.buyer_country,
    },
    order_items: sellerItems.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price: fromMicroPi(item.price),
      product: item.products
        ? {
            id: item.products.id,
            name: item.products.name,
            images: item.products.images ?? [],
          }
        : undefined,
    })),
  };
}

/* =====================================================
   GET ORDERS BY BUYER
===================================================== */
export async function getOrdersByBuyerSafe(
  buyerPiUid: string
): Promise<OrderRecord[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?buyer_pi_uid=eq.${buyerPiUid}&order=created_at.desc&select=
      id,
      status,
      total,
      created_at,
      order_items(
        id,
        quantity,
        price,
        product_id,
        status,
        seller_pi_uid,
        products(id,name,images)
      )
    `,
    { headers: headers(), cache: "no-store" }
  );

  if (!res.ok) return [];

  const raw = await res.json();

  return raw.map((order: any) => ({
    id: order.id,
    status: order.status,
    created_at: order.created_at,
    total: fromMicroPi(order.total),
    order_items: order.order_items.map((item: any) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price: fromMicroPi(item.price),
      status: item.status,
      product: item.products
        ? {
            id: item.products.id,
            name: item.products.name,
            images: item.products.images ?? [],
          }
        : undefined,
    })),
  }));
}
