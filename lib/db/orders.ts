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
   HEADERS (SERVER ONLY)
========================= */
function headers() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

/* =========================
   TYPES
========================= */
export type ProductRef = {
  name: string;
  image_url: string | null;
};

export type OrderItemRecord = {
  product_id: string;
  quantity: number;
  price: number; // Pi
  products: ProductRef | null;
};

export type OrderRecord = {
  id: string;
  status: string;
  total: number; // Pi
  created_at: string;
  order_items: OrderItemRecord[];
};

/* =====================================================
   GET ORDERS BY BUYER
===================================================== */
export async function getOrdersByBuyerSafe(
  buyerPiUid: string
): Promise<OrderRecord[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?buyer_id=eq.${buyerPiUid}&order=created_at.desc&select=id,status,total,created_at,order_items(quantity,price,product_id,products(name,image_url))`,
    { headers: headers(), cache: "no-store" }
  );

  if (!res.ok) return [];

  const raw = await res.json() as Array<{
    id: string;
    status: string;
    total: number;
    created_at: string;
    order_items: Array<{
      quantity: number;
      price: number;
      product_id: string;
      products: ProductRef | null;
    }>;
  }>;

  return raw.map((o) => ({
    id: o.id,
    status: o.status,
    created_at: o.created_at,
    total: fromMicroPi(o.total),
    order_items: o.order_items.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      price: fromMicroPi(i.price),
      products: i.products,
    })),
  }));
}

/* =====================================================
   GET ORDER DETAIL
===================================================== */
export async function getOrderById(
  orderId: string
): Promise<OrderRecord | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=id,status,total,created_at,order_items(quantity,price,product_id,products(name,image_url))`,
    { headers: headers(), cache: "no-store" }
  );

  if (!res.ok) return null;

  const data = await res.json() as Array<{
    id: string;
    status: string;
    total: number;
    created_at: string;
    order_items: Array<{
      quantity: number;
      price: number;
      product_id: string;
      products: ProductRef | null;
    }>;
  }>;

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
      products: i.products,
    })),
  };
}

/* =====================================================
   CREATE ORDER
===================================================== */
export async function createOrderSafe({
  buyerPiUid,
  items,
  total,
}: {
  buyerPiUid: string;
  items: Array<{
    product_id: string;
    quantity: number;
    price: number; // Pi
    seller_pi_uid: string;
  }>;
  total: number;
}) {
  /* 1️⃣ CREATE ORDER */
  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders`,
    {
      method: "POST",
      headers: {
        ...headers(),
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        buyer_id: buyerPiUid,
        total: toMicroPi(total),
        status: "pending",
      }),
    }
  );

  if (!orderRes.ok) {
    const err = await orderRes.text();
    throw new Error("CREATE_ORDER_FAILED: " + err);
  }

  const orderData = await orderRes.json() as Array<{
    id: string;
    status: string;
  }>;

  const order = orderData[0];

  /* 2️⃣ CREATE ORDER ITEMS */
  const orderItems = items.map((i) => ({
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
    const err = await itemsRes.text();
    throw new Error("CREATE_ORDER_ITEMS_FAILED: " + err);
  }

  return {
    id: order.id,
    status: order.status,
    total,
  };
}

/* =====================================================
   UPDATE ORDER STATUS
===================================================== */
export async function updateOrderStatus(
  orderId: string,
  status: string
) {
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
   GET ORDERS BY SELLER
   - Chỉ trả về item thuộc seller đó
===================================================== */
export async function getOrdersBySeller(
  sellerPiUid: string,
  status?: string
): Promise<OrderRecord[]> {

  const itemStatusFilter = status ? `&status=eq.${status}` : "";

  /* 1️⃣ Lấy order_items của seller */
  const itemsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?select=order_id&seller_pi_uid=eq.${sellerPiUid}${itemStatusFilter}`,
    { headers: headers(), cache: "no-store" }
  );

  if (!itemsRes.ok) return [];

  const items = await itemsRes.json() as Array<{ order_id: string }>;

  const orderIds = Array.from(new Set(items.map((i) => i.order_id)));

  if (orderIds.length === 0) return [];

  const ids = orderIds.map((id) => `"${id}"`).join(",");

  /* 2️⃣ Lấy orders + chỉ item thuộc seller */
  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=in.(${ids})&order=created_at.desc&select=id,status,total,created_at,order_items(quantity,price,product_id,seller_pi_uid,products(name,image_url))`,
    { headers: headers(), cache: "no-store" }
  );

  if (!orderRes.ok) return [];

  const raw = await orderRes.json() as Array<{
    id: string;
    status: string;
    total: number;
    created_at: string;
    order_items: Array<{
      quantity: number;
      price: number;
      product_id: string;
      seller_pi_uid: string;
      products: ProductRef | null;
    }>;
  }>;

  /* 3️⃣ Filter lại order_items theo seller */
  return raw.map((o) => {
    const filteredItems = o.order_items
      .filter((i) => i.seller_pi_uid === sellerPiUid)
      .map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        price: fromMicroPi(i.price),
        products: i.products,
      }));

    return {
      id: o.id,
      status: o.status,
      created_at: o.created_at,
      total: fromMicroPi(o.total),
      order_items: filteredItems,
    };
  });
}
