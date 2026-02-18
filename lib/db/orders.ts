const SUPABASE_URL = process.env.SUPABASE_URL!;
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
  price: number; // Pi
  product?: {
    id: string;
    name: string;
    images: string[];
  };
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
  piUid: string
): Promise<OrderRecord[]> {
  const userRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?pi_uid=eq.${piUid}&select=pi_uid`,
    { headers: headers(), cache: "no-store" }
  );

  if (!userRes.ok) return [];

  const users = (await userRes.json()) as Array<{ pi_uid: string }>;
  const buyerId = users[0]?.pi_uid;
  if (!buyerId) return [];

  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?buyer_id=eq.${buyerId}&order=created_at.desc&select=id,total,status,created_at,order_items(quantity,price,product_id)`,
    { headers: headers(), cache: "no-store" }
  );

  if (!orderRes.ok) return [];

  const rawOrders = (await orderRes.json()) as Array<{
    id: string;
    status: string;
    total: number;
    created_at: string;
    order_items: Array<{
      quantity: number;
      price: number;
      product_id: string;
    }>;
  }>;

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
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=id,status,total,created_at,order_items(quantity,price,product_id)`,
    { headers: headers(), cache: "no-store" }
  );

  if (!res.ok) return null;

  const data = (await res.json()) as Array<{
    id: string;
    status: string;
    total: number;
    created_at: string;
    order_items: Array<{
      quantity: number;
      price: number;
      product_id: string;
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
  total: number; // Pi
}): Promise<{ id: string; status: string; total: number }> {
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

  const orderItemsPayload = items.map((i) => ({
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
      body: JSON.stringify(orderItemsPayload),
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
   UPDATE ORDER STATUS
===================================================== */
export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<void> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`,
    {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ status }),
    }
  );

  if (!res.ok) {
    throw new Error(await res.text());
  }
}

/* =====================================================
   GET ORDERS BY SELLER (FIXED)
===================================================== */
export async function getOrdersBySeller(
  sellerPiUid: string,
  status?: string
): Promise<OrderRecord[]> {
  /* 1️⃣ Lấy order_id theo seller + status */
  const statusFilter = status ? `&status=eq.${status}` : "";

  const itemsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?select=order_id&seller_pi_uid=eq.${sellerPiUid}${statusFilter}`,
    { headers: headers(), cache: "no-store" }
  );

  if (!itemsRes.ok) return [];

  const items = (await itemsRes.json()) as Array<{ order_id: string }>;

  const orderIds = Array.from(
    new Set(items.map((i) => i.order_id))
  );

  if (orderIds.length === 0) return [];

  /* 2️⃣ Fetch orders + ALL order_items */
  const ids = orderIds.map((id) => `"${id}"`).join(",");

  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=in.(${ids})&order=created_at.desc&select=id,status,total,created_at,order_items(id,quantity,price,product_id,status,seller_pi_uid,products(id,name,images))`,
    { headers: headers(), cache: "no-store" }
  );

  if (!orderRes.ok) return [];

  const rawOrders = (await orderRes.json()) as Array<{
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

  /* 3️⃣ Filter lại order_items theo seller + status */
  return rawOrders
    .map((order) => {
      const sellerItems = order.order_items.filter(
        (item) =>
          item.seller_pi_uid === sellerPiUid &&
          (!status || item.status === status)
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
   CONFIRM ORDER BY SELLER
===================================================== */
export async function confirmOrderBySeller(
  sellerPiUid: string,
  orderId: string
): Promise<void> {
  await updateSellerOrderItemsStatus(
    sellerPiUid,
    orderId,
    "confirmed"
  );
}

/* =====================================================
   CANCEL ORDER BY SELLER
===================================================== */
export async function cancelOrderBySeller(
  sellerPiUid: string,
  orderId: string
): Promise<void> {
  await updateSellerOrderItemsStatus(
    sellerPiUid,
    orderId,
    "cancelled"
  );
}

/* =====================================================
   START SHIPPING BY SELLER
   - confirmed → shipping
===================================================== */
export async function startShippingBySeller(
  sellerPiUid: string,
  orderId: string
): Promise<void> {
  await updateSellerOrderItemsToShipping(
    sellerPiUid,
    orderId
  );
}

/* =====================================================
   COMPLETE ORDER BY SELLER
   - shipping → completed
===================================================== */
export async function completeOrderBySeller(
  sellerPiUid: string,
  orderId: string
): Promise<void> {
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${orderId}&seller_pi_uid=eq.${sellerPiUid}&select=id,status`,
    { headers: headers(), cache: "no-store" }
  );

  if (!checkRes.ok) {
    throw new Error(await checkRes.text());
  }

  const items = (await checkRes.json()) as Array<{
    id: string;
    status: string;
  }>;

  const shippingIds = items
    .filter((i) => i.status === "shipping")
    .map((i) => i.id);

  if (shippingIds.length === 0) {
    throw new Error("NO_SHIPPING_ITEMS");
  }

  const ids = shippingIds.map((id) => `"${id}"`).join(",");

  const updateRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?id=in.(${ids})`,
    {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ status: "completed" }),
    }
  );

  if (!updateRes.ok) {
    throw new Error(await updateRes.text());
  }
}

/* =====================================================
   INTERNAL SHIPPING LOGIC
===================================================== */
async function updateSellerOrderItemsToShipping(
  sellerPiUid: string,
  orderId: string
): Promise<void> {
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${orderId}&seller_pi_uid=eq.${sellerPiUid}&select=id,status`,
    { headers: headers(), cache: "no-store" }
  );

  if (!checkRes.ok) {
    throw new Error(await checkRes.text());
  }

  const items = (await checkRes.json()) as Array<{
    id: string;
    status: string;
  }>;

  const confirmedIds = items
    .filter((i) => i.status === "confirmed")
    .map((i) => i.id);

  if (confirmedIds.length === 0) {
    throw new Error("NO_CONFIRMED_ITEMS");
  }

  const ids = confirmedIds.map((id) => `"${id}"`).join(",");

  const updateRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?id=in.(${ids})`,
    {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ status: "shipping" }),
    }
  );

  if (!updateRes.ok) {
    throw new Error(await updateRes.text());
  }
}

/* =====================================================
   INTERNAL SHARED LOGIC
===================================================== */
async function updateSellerOrderItemsStatus(
  sellerPiUid: string,
  orderId: string,
  newStatus: "confirmed" | "cancelled"
): Promise<void> {
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${orderId}&seller_pi_uid=eq.${sellerPiUid}&select=id,status`,
    { headers: headers(), cache: "no-store" }
  );

  if (!checkRes.ok) {
    throw new Error(await checkRes.text());
  }

  const items = (await checkRes.json()) as Array<{
    id: string;
    status: string;
  }>;

  const pendingIds = items
    .filter((i) => i.status === "pending")
    .map((i) => i.id);

  if (pendingIds.length === 0) {
    throw new Error("NO_PENDING_ITEMS");
  }

  const ids = pendingIds.map((id) => `"${id}"`).join(",");

  const updateRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?id=in.(${ids})`,
    {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ status: newStatus }),
    }
  );

  if (!updateRes.ok) {
    throw new Error(await updateRes.text());
  }
}

/* =====================================================
   GET ORDER DETAIL BY SELLER (SAFE)
===================================================== */
export async function getOrderDetailBySeller(
  sellerPiUid: string,
  orderId: string
): Promise<OrderRecord | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=id,status,total,created_at,order_items(id,quantity,price,product_id,status,seller_pi_uid,products(id,name,images))`,
    { headers: headers(), cache: "no-store" }
  );

  if (!res.ok) return null;

  const data = await res.json();
  const order = data[0];
  if (!order) return null;

  // 🔐 Filter order_items theo seller
  const sellerItems = order.order_items.filter(
    (item: any) => item.seller_pi_uid === sellerPiUid
  );

  if (sellerItems.length === 0) return null;

  return {
    id: order.id,
    status: order.status,
    created_at: order.created_at,
    total: fromMicroPi(order.total),
    order_items: sellerItems.map((item: any) => ({
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
