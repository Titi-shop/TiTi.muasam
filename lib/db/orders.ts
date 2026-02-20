const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * 1 Pi = 1_000_000 microPi
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
  price: number; // Pi
};

export type OrderRecord = {
  id: string;
  status: string;
  total: number; // Pi
  created_at: string;
  order_items: OrderItemRecord[];
};

export type SellerOrderItem = {
  product_id: string;
  quantity: number;
  price: number;
  product_name?: string | null;
  product_image?: string | null;
};

export type SellerOrderRecord = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  buyer_name?: string;
  buyer_phone?: string;
  buyer_address?: string;
  order_items: SellerOrderItem[];
};

/* =====================================================
   GET ORDERS BY BUYER
===================================================== */

type RawBuyerOrderItem = {
  product_id: string;
  quantity: number;
  price: number;
};

type RawBuyerOrder = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  order_items: RawBuyerOrderItem[];
};

export async function getOrdersByBuyerSafe(
  piUid: string
): Promise<OrderRecord[]> {

  const userRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?pi_uid=eq.${piUid}&select=pi_uid`,
    { headers: headers(), cache: "no-store" }
  );

  if (!userRes.ok) return [];

  const users: { pi_uid: string }[] = await userRes.json();
  const buyerId = users[0]?.pi_uid;
  if (!buyerId) return [];

  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?buyer_id=eq.${buyerId}&order=created_at.desc&select=id,total,status,created_at,order_items(product_id,quantity,price)`,
    { headers: headers(), cache: "no-store" }
  );

  if (!orderRes.ok) return [];

  const rawOrders: RawBuyerOrder[] = await orderRes.json();

  return rawOrders.map((o) => ({
    id: o.id,
    status: o.status,
    created_at: o.created_at,
    total: fromMicroPi(o.total),
    order_items: o.order_items.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      price: fromMicroPi(i.price),
    })),
  }));
}

/* =====================================================
   GET ORDER BY ID
===================================================== */

export async function getOrderById(
  orderId: string
): Promise<OrderRecord | null> {

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=id,status,total,created_at,order_items(product_id,quantity,price)`,
    { headers: headers(), cache: "no-store" }
  );

  if (!res.ok) return null;

  const data: RawBuyerOrder[] = await res.json();
  const o = data[0];
  if (!o) return null;

  return {
    id: o.id,
    status: o.status,
    created_at: o.created_at,
    total: fromMicroPi(o.total),
    order_items: o.order_items.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      price: fromMicroPi(i.price),
    })),
  };
}

/* =====================================================
   CREATE ORDER
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
}) {

  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders`,
    {
      method: "POST",
      headers: {
        ...headers(),
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        buyer_id: params.buyerPiUid,
        total: toMicroPi(params.total),
        status: "pending",
      }),
    }
  );

  if (!orderRes.ok) {
    throw new Error("CREATE_ORDER_FAILED");
  }

  const orderData: { id: string; status: string }[] =
    await orderRes.json();

  const order = orderData[0];

  const orderItems = params.items.map((i) => ({
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
      body: JSON.stringify(orderItems),
    }
  );

  if (!itemsRes.ok) {
    throw new Error("CREATE_ORDER_ITEMS_FAILED");
  }

  return {
    id: order.id,
    status: order.status,
    total: params.total,
  };
}

/* =====================================================
   UPDATE ORDER STATUS
===================================================== */

export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<void> {

  await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`,
    {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ status }),
    }
  );
}

/* =====================================================
   GET ORDERS BY SELLER (MARKETPLACE SAFE)
===================================================== */

type RawProduct = {
  id: string;
  name: string | null;
  images: string[] | null;
};

type RawSellerOrderItem = {
  product_id: string;
  quantity: number;
  price: number;
  status: string;
  seller_pi_uid: string;
  products: RawProduct | null;
};

type RawSellerOrder = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  buyer_name: string | null;
  buyer_phone: string | null;
  buyer_address: string | null;
  order_items: RawSellerOrderItem[];
};

export async function getOrdersBySeller(
  sellerPiUid: string,
  status?: "pending" | "confirmed" | "shipping" | "cancelled" | "completed" | "returned"
): Promise<SellerOrderRecord[]> {

  const itemQuery = new URLSearchParams({
    select: "order_id",
    seller_pi_uid: `eq.${sellerPiUid}`,
  });

  if (status) {
    itemQuery.append("status", `eq.${status}`);
  }

  const itemsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?${itemQuery.toString()}`,
    { headers: headers(), cache: "no-store" }
  );

  if (!itemsRes.ok) return [];

  const items: { order_id: string }[] = await itemsRes.json();

  const orderIds = Array.from(new Set(items.map((i) => i.order_id)));
  if (orderIds.length === 0) return [];

  const ids = orderIds.map((id) => `"${id}"`).join(",");

  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=in.(${ids})&order=created_at.desc&select=
      id,
      status,
      total,
      created_at,
      buyer_name,
      buyer_phone,
      buyer_address,
      order_items(
        product_id,
        quantity,
        price,
        status,
        seller_pi_uid,
        products(
  id,
  name,
  images
)
      )
    `,
    { headers: headers(), cache: "no-store" }
  );

  if (!orderRes.ok) return [];

  const raw: RawSellerOrder[] = await orderRes.json();

  return raw
    .map((o): SellerOrderRecord | null => {

      const sellerItems = o.order_items.filter(
        (i) =>
          i.seller_pi_uid === sellerPiUid &&
          (!status || i.status === status)
      );

      if (sellerItems.length === 0) return null;

      return {
        id: o.id,
        status: status ?? o.status,
        created_at: o.created_at,
        total: fromMicroPi(o.total),

        buyer_name: o.buyer_name ?? undefined,
        buyer_phone: o.buyer_phone ?? undefined,
        buyer_address: o.buyer_address ?? undefined,

        order_items: sellerItems.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          price: fromMicroPi(i.price),
          product_name: i.products?.name ?? null,
          product_image: i.products?.images?.[0] ?? null,
        })),
      };
    })
    .filter((o): o is SellerOrderRecord => o !== null);
}
