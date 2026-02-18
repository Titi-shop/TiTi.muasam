/* =====================================================
   SUPABASE CONFIG
===================================================== */
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/* =====================================================
   PI CONFIG
===================================================== */
const PI_BASE = 1_000_000;

function toMicroPi(value: number): number {
  return Math.round(value * PI_BASE);
}

function fromMicroPi(value: number): number {
  return value / PI_BASE;
}

/* =====================================================
   HEADERS (SERVER ONLY)
===================================================== */
function headers(): HeadersInit {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

/* =====================================================
   TYPES
===================================================== */
export type OrderItemRecord = {
  product_id: string;
  quantity: number;
  price: number;
  status?: string;
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
   GET ORDERS BY BUYER
===================================================== */
export async function getOrdersByBuyerSafe(
  buyerPiUid: string
): Promise<OrderRecord[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?buyer_id=eq.${buyerPiUid}&order=created_at.desc&select=
      id,
      status,
      total,
      created_at,
      order_items(
        quantity,
        price,
        product_id,
        status,
        products(id,name,images)
      )
    `,
    { headers: headers(), cache: "no-store" }
  );

  if (!res.ok) return [];

  const raw = (await res.json()) as Array<{
    id: string;
    status: string;
    total: number;
    created_at: string;
    order_items: Array<{
      product_id: string;
      quantity: number;
      price: number;
      status: string;
      products: {
        id: string;
        name: string;
        images: string[] | null;
      } | null;
    }>;
  }>;

  return raw.map((order) => ({
    id: order.id,
    status: order.status,
    created_at: order.created_at,
    total: fromMicroPi(order.total),
    order_items: order.order_items.map((item) => ({
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

/* =====================================================
   GET ORDERS BY SELLER (NO STATUS FILTER IN DB)
===================================================== */
export async function getOrdersBySeller(
  sellerPiUid: string
): Promise<OrderRecord[]> {
  const itemsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?select=order_id&seller_pi_uid=eq.${sellerPiUid}`,
    { headers: headers(), cache: "no-store" }
  );

  if (!itemsRes.ok) return [];

  const items = (await itemsRes.json()) as Array<{
    order_id: string;
  }>;

  const orderIds = Array.from(new Set(items.map((i) => i.order_id)));

  if (orderIds.length === 0) return [];

  const ids = orderIds.map((id) => `"${id}"`).join(",");

  const ordersRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=in.(${ids})&order=created_at.desc&select=
      id,
      status,
      total,
      created_at,
      order_items(
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
      product_id: string;
      quantity: number;
      price: number;
      status: string;
      seller_pi_uid: string;
      products: {
        id: string;
        name: string;
        images: string[] | null;
      } | null;
    }>;
  }>;

  return rawOrders
    .map((order) => {
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
        order_items: sellerItems.map((item) => ({
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
      };
    })
    .filter((o): o is OrderRecord => o !== null);
}

/* =====================================================
   CREATE ORDER (WITH SHIPPING SNAPSHOT)
===================================================== */
export async function createOrderSafe(params: {
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
  const { buyerPiUid, items, total, shipping } = params;

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
