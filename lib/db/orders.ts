const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
  status: string;
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
  };
  order_items: OrderItemRecord[];
};

/* =====================================================
   INTERNAL: FETCH PRODUCTS MAP
===================================================== */
async function fetchProductsMap(
  productIds: string[]
): Promise<Record<string, { id: string; name: string; images: string[] }>> {

  if (productIds.length === 0) return {};

  const ids = productIds.map((id) => `"${id}"`).join(",");

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/products?id=in.(${ids})&select=id,name,images`,
    { headers: headers(), cache: "no-store" }
  );

  if (!res.ok) return {};

  const products = await res.json() as Array<{
    id: string;
    name: string;
    images: string[] | null;
  }>;

  return Object.fromEntries(
    products.map((p) => [
      p.id,
      {
        id: p.id,
        name: p.name,
        images: p.images ?? [],
      },
    ])
  );
}

/* =====================================================
   GET ORDERS BY BUYER
===================================================== */
export async function getOrdersByBuyer(
  buyerPiUid: string
): Promise<OrderRecord[]> {

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?buyer_id=eq.${buyerPiUid}&order=created_at.desc&select=
      id,
      status,
      total,
      created_at,
      order_items(quantity,price,product_id,status)
    `,
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
      status: string;
    }>;
  }>;

  const productIds = Array.from(
    new Set(
      raw.flatMap((o) =>
        o.order_items.map((i) => i.product_id)
      )
    )
  );

  const productsMap = await fetchProductsMap(productIds);

  return raw.map((o): OrderRecord => ({
    id: o.id,
    status: o.status,
    total: fromMicroPi(o.total),
    created_at: o.created_at,
    order_items: o.order_items.map((i): OrderItemRecord => ({
      product_id: i.product_id,
      quantity: i.quantity,
      price: fromMicroPi(i.price),
      status: i.status,
      product: productsMap[i.product_id],
    })),
  }));
}

/* =====================================================
   GET ORDERS BY SELLER
===================================================== */
export async function getOrdersBySeller(
  sellerPiUid: string,
  status?: "pending" | "confirmed" | "shipping" | "cancelled" | "completed"
): Promise<OrderRecord[]> {

  const itemQuery = new URLSearchParams({
    select: "order_id",
    seller_pi_uid: `eq.${sellerPiUid}`,
  });

  const itemsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?${itemQuery.toString()}`,
    { headers: headers(), cache: "no-store" }
  );

  if (!itemsRes.ok) return [];

  const items = await itemsRes.json() as Array<{ order_id: string }>;

  const orderIds = Array.from(new Set(items.map(i => i.order_id)));
  if (orderIds.length === 0) return [];

  const ids = orderIds.map(id => `"${id}"`).join(",");

  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=in.(${ids})&order=created_at.desc&select=
      id,
      status,
      total,
      created_at,
      buyer_name,
      buyer_phone,
      buyer_address,
      order_items(quantity,price,product_id,status,seller_pi_uid)
    `,
    { headers: headers(), cache: "no-store" }
  );

  if (!orderRes.ok) return [];

  const rawOrders = await orderRes.json() as Array<{
    id: string;
    status: string;
    total: number;
    created_at: string;
    buyer_name: string | null;
    buyer_phone: string | null;
    buyer_address: string | null;
    order_items: Array<{
      quantity: number;
      price: number;
      product_id: string;
      status: string;
      seller_pi_uid: string;
    }>;
  }>;

  const productIds = Array.from(
    new Set(
      rawOrders.flatMap(o =>
        o.order_items.map(i => i.product_id)
      )
    )
  );

  const productsMap = await fetchProductsMap(productIds);

  return rawOrders
    .map((o): OrderRecord | null => {

      if (status && o.status !== status) return null;

const sellerItems = o.order_items.filter(
  i => i.seller_pi_uid === sellerPiUid
);

      if (sellerItems.length === 0) return null;

      return {
        id: o.id,
        status: o.status,
        total: fromMicroPi(o.total),
        created_at: o.created_at,
        buyer: {
          name: o.buyer_name ?? "",
          phone: o.buyer_phone ?? "",
          address: o.buyer_address ?? "",
        },
        order_items: sellerItems.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          price: fromMicroPi(i.price),
          status: i.status,
          product: productsMap[i.product_id],
        })),
      };
    })
    .filter((o): o is OrderRecord => o !== null);
}
/* =====================================================
   CREATE ORDER
===================================================== */
export async function createOrder(params: {
  buyerPiUid: string;
  items: {
    product_id: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  shipping: {
    name: string;
    phone: string;
    address: string;
  };
}): Promise<OrderRecord | null> {

  const { buyerPiUid, items, total, shipping } = params;

  /* =========================
     1️⃣ CREATE ORDER
  ========================= */
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
        buyer_name: shipping.name,
        buyer_phone: shipping.phone,
        buyer_address: shipping.address,
        total: toMicroPi(total),
        status: "pending",
      }),
    }
  );

  if (!orderRes.ok) {
    console.error(await orderRes.text());
    return null;
  }

  const [order] = await orderRes.json() as Array<{ id: string }>;

  if (!order?.id) return null;

  /* =========================
     2️⃣ FETCH SELLER MAP
  ========================= */
  const productIds = items.map(i => `"${i.product_id}"`).join(",");

  const productRes = await fetch(
    `${SUPABASE_URL}/rest/v1/products?id=in.(${productIds})&select=id,seller_id`,
    { headers: headers(), cache: "no-store" }
  );

  if (!productRes.ok) {
    console.error(await productRes.text());
    return null;
  }

  const products = await productRes.json() as Array<{
    id: string;
    seller_id: string;
  }>;

  const sellerMap: Record<string, string> =
    Object.fromEntries(products.map(p => [p.id, p.seller_id]));

  /* =========================
     3️⃣ INSERT ORDER ITEMS
  ========================= */
  for (const item of items) {

    const seller = sellerMap[item.product_id];

    if (!seller) {
      console.error("SELLER_NOT_FOUND_FOR_PRODUCT", item.product_id);
      continue;
    }

    const itemRes = await fetch(
      `${SUPABASE_URL}/rest/v1/order_items`,
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          order_id: order.id,
          product_id: item.product_id,
          seller_pi_uid: seller,
          quantity: item.quantity,
          price: toMicroPi(item.price),
          status: "pending",
        }),
      }
    );

    if (!itemRes.ok) {
      console.error(await itemRes.text());
    }
  }

  return order as unknown as OrderRecord;
}

/* =====================================================
   GET ORDER DETAIL FOR SELLER
===================================================== */
export async function getOrderByIdForSeller(
  orderId: string,
  sellerPiUid: string
): Promise<OrderRecord | null> {

  /* =========================
     1️⃣ VERIFY SELLER OWNS ITEM
  ========================= */
  const verifyRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${orderId}&seller_pi_uid=eq.${sellerPiUid}&select=order_id`,
    { headers: headers(), cache: "no-store" }
  );

  if (!verifyRes.ok) return null;

  const verifyItems = await verifyRes.json() as Array<{ order_id: string }>;

  if (verifyItems.length === 0) {
    // Seller không có item trong order này
    return null;
  }

  /* =========================
     2️⃣ FETCH ORDER FULL DATA
  ========================= */
  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=
      id,
      status,
      total,
      created_at,
      buyer_name,
      buyer_phone,
      buyer_address,
      order_items(quantity,price,product_id,status,seller_pi_uid)
    `,
    { headers: headers(), cache: "no-store" }
  );

  if (!orderRes.ok) return null;

  const [rawOrder] = await orderRes.json() as Array<{
    id: string;
    status: string;
    total: number;
    created_at: string;
    buyer_name: string | null;
    buyer_phone: string | null;
    buyer_address: string | null;
    order_items: Array<{
      quantity: number;
      price: number;
      product_id: string;
      status: string;
      seller_pi_uid: string;
    }>;
  }>;

  if (!rawOrder) return null;

  /* =========================
     3️⃣ FILTER ONLY SELLER ITEMS
  ========================= */
  const sellerItems = rawOrder.order_items.filter(
    i => i.seller_pi_uid === sellerPiUid
  );

  if (sellerItems.length === 0) return null;

  const productIds = Array.from(
    new Set(sellerItems.map(i => i.product_id))
  );

  const productsMap = await fetchProductsMap(productIds);

  return {
    id: rawOrder.id,
    status: rawOrder.status,
    total: fromMicroPi(rawOrder.total),
    created_at: rawOrder.created_at,
    buyer: {
      name: rawOrder.buyer_name ?? "",
      phone: rawOrder.buyer_phone ?? "",
      address: rawOrder.buyer_address ?? "",
    },
    order_items: sellerItems.map(i => ({
      product_id: i.product_id,
      quantity: i.quantity,
      price: fromMicroPi(i.price),
      status: i.status,
      product: productsMap[i.product_id],
    })),
  };
}
/* =====================================================
   UPDATE ORDER STATUS BY SELLER
===================================================== */
export async function updateOrderStatusBySeller(
  orderId: string,
  sellerPiUid: string,
  newStatus: "confirmed" | "shipping" | "cancelled" | "completed",
  extra?: {
    sellerMessage?: string | null;
    sellerCancelReason?: string | null;
  }
): Promise<boolean> {
  /* =========================
     1️⃣ VERIFY SELLER HAS ITEMS
  ========================= */
  const verifyRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${orderId}&seller_pi_uid=eq.${sellerPiUid}&select=id`,
    { headers: headers(), cache: "no-store" }
  );

  if (!verifyRes.ok) return false;

  const sellerItems = await verifyRes.json() as Array<{ id: string }>;

  if (sellerItems.length === 0) {
    return false;
  }

  /* =========================
     2️⃣ UPDATE SELLER ITEMS STATUS
  ========================= */
  const updateRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${orderId}&seller_pi_uid=eq.${sellerPiUid}`,
    {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({
  status: newStatus,
  ...(extra && "sellerMessage" in extra
    ? { seller_message: extra.sellerMessage }
    : {}),
  ...(extra && "sellerCancelReason" in extra
    ? { seller_cancel_reason: extra.sellerCancelReason }
    : {}),
}),
    }
  );

  if (!updateRes.ok) {
    console.error(await updateRes.text());
    return false;
  }

  /* =========================
     3️⃣ OPTIONAL: CHECK IF ALL ITEMS SAME STATUS
     THEN UPDATE ORDER STATUS
  ========================= */

  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${orderId}&select=status`,
    { headers: headers(), cache: "no-store" }
  );

  if (!checkRes.ok) return true;

  const allItems = await checkRes.json() as Array<{ status: string }>;

  const allSame = allItems.every(i => i.status === newStatus);

  if (allSame) {
    await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`,
      {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({
          status: newStatus,
        }),
      }
    );
  }

  return true;
}
