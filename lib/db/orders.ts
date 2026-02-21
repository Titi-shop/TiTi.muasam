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
   GET ORDERS BY BUYER
===================================================== */
export async function getOrdersByBuyerSafe(
  piUid: string
): Promise<OrderRecord[]> {
  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?buyer_id=eq.${piUid}&order=created_at.desc&select=id,total,status,created_at,order_items(quantity,price,product_id,status)`,
    { headers: headers(), cache: "no-store" }
  );

  if (!orderRes.ok) return [];

  const raw = (await orderRes.json()) as Array<{
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

  return raw.map((o) => ({
    id: o.id,
    status: o.status,
    created_at: o.created_at,
    total: fromMicroPi(o.total),
    order_items: o.order_items.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      price: fromMicroPi(i.price),
      status: i.status,
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
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=id,status,total,created_at,order_items(quantity,price,product_id,status)`,
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
      status: string;
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
      status: i.status,
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
  }>;
  total: number;
  shipping: {
    name: string;
    phone: string;
    address: string;
  };
}): Promise<{ id: string; status: string; total: number }> {
  const { buyerPiUid, items, total, shipping } = params;

  const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=representation" },
    body: JSON.stringify({
      buyer_id: buyerPiUid,
      total: toMicroPi(total),
      status: "pending",
      buyer_name: shipping.name,
      buyer_phone: shipping.phone,
      buyer_address: shipping.address,
    }),
  });

  if (!orderRes.ok) throw new Error(await orderRes.text());

  const orderData = (await orderRes.json()) as Array<{
    id: string;
    status: string;
  }>;

  const order = orderData[0];
  if (!order) throw new Error("ORDER_NOT_RETURNED");

  const payload: Array<{
    order_id: string;
    product_id: string;
    quantity: number;
    price: number;
    seller_pi_uid: string;
    status: string;
  }> = [];

  for (const i of items) {
    const productRes = await fetch(
      `${SUPABASE_URL}/rest/v1/products?id=eq.${i.product_id}&select=seller_id`,
      { headers: headers() }
    );

    if (!productRes.ok) throw new Error("PRODUCT_NOT_FOUND");

    const productData = (await productRes.json()) as Array<{
      seller_id: string;
    }>;

    const product = productData[0];
    if (!product?.seller_id) throw new Error("SELLER_NOT_FOUND");

    payload.push({
      order_id: order.id,
      product_id: i.product_id,
      quantity: i.quantity,
      price: toMicroPi(i.price),
      seller_pi_uid: product.seller_id,
      status: "pending",
    });
  }

  const itemsRes = await fetch(`${SUPABASE_URL}/rest/v1/order_items`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });

  if (!itemsRes.ok) throw new Error(await itemsRes.text());

  return { id: order.id, status: order.status, total };
}

/* =====================================================
   GET ORDERS BY SELLER (SAFE - NO JOIN)
===================================================== */
export async function getOrdersBySeller(
  sellerPiUid: string,
  status?: "pending" | "confirmed" | "shipping" | "cancelled" | "completed"
): Promise<OrderRecord[]> {

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

  const items = (await itemsRes.json()) as Array<{
    order_id: string;
  }>;

  const orderIds = Array.from(new Set(items.map((i) => i.order_id)));
  if (orderIds.length === 0) return [];

  const ids = orderIds.map((id) => `"${id}"`).join(",");

  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=in.(${ids})&order=created_at.desc&select=id,status,total,created_at,buyer_name,buyer_phone,buyer_address,order_items(quantity,price,product_id,status,seller_pi_uid)`,
    { headers: headers(), cache: "no-store" }
  );

  if (!orderRes.ok) return [];

  const rawOrders = (await orderRes.json()) as Array<{
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

  // ===============================
  // LẤY DANH SÁCH PRODUCT ID
  // ===============================
  const productIds = Array.from(
    new Set(
      rawOrders.flatMap((o) =>
        o.order_items.map((i) => i.product_id)
      )
    )
  );

  let productsMap: Record<
    string,
    { id: string; name: string; images: string[] }
  > = {};

  if (productIds.length > 0) {
    const productIdsString = productIds.map((id) => `"${id}"`).join(",");

    const productRes = await fetch(
      `${SUPABASE_URL}/rest/v1/products?id=in.(${productIdsString})&select=id,name,images`,
      { headers: headers(), cache: "no-store" }
    );

    if (productRes.ok) {
      const products = (await productRes.json()) as Array<{
        id: string;
        name: string;
        images: string[] | null;
      }>;

      productsMap = Object.fromEntries(
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
  }

  // ===============================
  // MAP KẾT QUẢ
  // ===============================
  return rawOrders
    .map((o) => {
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
        buyer: {
          name: o.buyer_name ?? "",
          phone: o.buyer_phone ?? "",
          address: o.buyer_address ?? "",
        },
        order_items: sellerItems.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          price: fromMicroPi(i.price),
          status: i.status,
          product: productsMap[i.product_id], // ✅ ẢNH Ở ĐÂY
        })),
      };
    })
    .filter((o): o is OrderRecord => o !== null);
}

/* =====================================================
   SELLER STATUS UPDATES
===================================================== */
async function updateSellerOrderItemsStatus(
  sellerPiUid: string,
  orderId: string,
  newStatus: string
): Promise<void> {
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${orderId}&seller_pi_uid=eq.${sellerPiUid}&select=id,status`,
    { headers: headers(), cache: "no-store" }
  );

  if (!checkRes.ok) throw new Error(await checkRes.text());

  const items = (await checkRes.json()) as Array<{
    id: string;
    status: string;
  }>;

  const ids = items
    .filter((i) => i.status !== newStatus)
    .map((i) => `"${i.id}"`)
    .join(",");

  if (!ids) throw new Error("NO_VALID_ITEMS");

  const updateRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?id=in.(${ids})`,
    {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ status: newStatus }),
    }
  );

  if (!updateRes.ok) throw new Error(await updateRes.text());
}

export async function confirmOrderBySeller(
  sellerPiUid: string,
  orderId: string
) {
  await updateSellerOrderItemsStatus(
    sellerPiUid,
    orderId,
    "confirmed"
  );
}

export async function cancelOrderBySeller(
  sellerPiUid: string,
  orderId: string
) {
  await updateSellerOrderItemsStatus(
    sellerPiUid,
    orderId,
    "cancelled"
  );
}

export async function startShippingBySeller(
  sellerPiUid: string,
  orderId: string
) {
  await updateSellerOrderItemsStatus(
    sellerPiUid,
    orderId,
    "shipping"
  );
}

export async function completeOrderBySeller(
  sellerPiUid: string,
  orderId: string
) {
  await updateSellerOrderItemsStatus(
    sellerPiUid,
    orderId,
    "completed"
  );
}

export async function getOrderDetailBySeller(
  sellerPiUid: string,
  orderId: string
): Promise<OrderRecord | null> {
  const orders = await getOrdersBySeller(sellerPiUid);
  return orders.find((o) => o.id === orderId) ?? null;
}
