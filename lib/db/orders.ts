const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/* =========================
   PI CONSTANTS
========================= */
const PI_BASE = 1_000_000;

function toMicroPi(value: number): number {
  return Math.round(value * PI_BASE);
}

function fromMicroPi(value: number): number {
  return value / PI_BASE;
}

/* =========================
   HEADERS
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
type ProductRow = {
  id: string;
  name: string;
  images: string[] | null;
};

type OrderItemRow = {
  product_id: string;
  quantity: number;
  price: number;
  seller_pi_uid: string;
  products: ProductRow | null;
};

type OrderRow = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  order_items: OrderItemRow[];
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

  const users = await userRes.json();
  const buyerId = users[0]?.pi_uid;
  if (!buyerId) return [];

  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?buyer_id=eq.${buyerId}&order=created_at.desc&select=id,status,total,created_at,order_items(quantity,price,product_id)`,
    { headers: headers(), cache: "no-store" }
  );
  if (!orderRes.ok) return [];

  const rawOrders = await orderRes.json();

  return rawOrders.map((o: any) => ({
    id: o.id,
    status: o.status,
    created_at: o.created_at,
    total: fromMicroPi(o.total),
    order_items: o.order_items.map((i: any) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      price: fromMicroPi(i.price),
    })),
  }));
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
    price: number;
    seller_pi_uid: string;
  }>;
  total: number;
}) {
  const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=representation" },
    body: JSON.stringify({
      buyer_id: buyerPiUid,
      total: toMicroPi(total),
      status: "pending",
    }),
  });

  if (!orderRes.ok) {
    throw new Error(await orderRes.text());
  }

  const [order] = await orderRes.json();

  const orderItems = items.map((i) => ({
    order_id: order.id,
    product_id: i.product_id,
    quantity: i.quantity,
    price: toMicroPi(i.price),
    seller_pi_uid: i.seller_pi_uid,
    status: "pending",
  }));

  await fetch(`${SUPABASE_URL}/rest/v1/order_items`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(orderItems),
  });

  return { id: order.id, status: order.status, total };
}

/* =====================================================
   GET ORDERS BY SELLER
===================================================== */

export async function getOrdersBySeller(
  sellerPiUid: string,
  status?: string
): Promise<OrderRecord[]> {
  const statusFilter = status ? `&status=eq.${status}` : "";

  const itemsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?select=order_id&seller_pi_uid=eq.${sellerPiUid}${statusFilter}`,
    { headers: headers(), cache: "no-store" }
  );

  if (!itemsRes.ok) return [];

  const items: Array<{ order_id: string }> = await itemsRes.json();
  const orderIds = Array.from(new Set(items.map(i => i.order_id)));
  if (orderIds.length === 0) return [];

  const ids = orderIds.map(id => `"${id}"`).join(",");

  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=in.(${ids})&order=created_at.desc&select=id,status,total,created_at,order_items(quantity,price,product_id,seller_pi_uid,products(id,name,images))`,
    { headers: headers(), cache: "no-store" }
  );

  if (!orderRes.ok) return [];

  const rawOrders: OrderRow[] = await orderRes.json();

  return rawOrders.map((o) => ({
    id: o.id,
    status: o.status,
    created_at: o.created_at,
    total: fromMicroPi(o.total),
    order_items: o.order_items
      .filter(i => i.seller_pi_uid === sellerPiUid)
      .map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        price: fromMicroPi(i.price),
        product: i.products
          ? {
              id: i.products.id,
              name: i.products.name,
              images: i.products.images ?? [],
            }
          : undefined,
      })),
  }));
}
/* =====================================================
   CONFIRM / CANCEL BY SELLER
===================================================== */
export async function confirmOrderBySeller(
  sellerPiUid: string,
  orderId: string
) {
  await updateSellerItemsStatus(sellerPiUid, orderId, "confirmed");
}

export async function cancelOrderBySeller(
  sellerPiUid: string,
  orderId: string
) {
  await updateSellerItemsStatus(sellerPiUid, orderId, "cancelled");
}

async function updateSellerItemsStatus(
  sellerPiUid: string,
  orderId: string,
  status: "confirmed" | "cancelled"
) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${orderId}&seller_pi_uid=eq.${sellerPiUid}&select=id,status`,
    { headers: headers(), cache: "no-store" }
  );
  if (!res.ok) throw new Error(await res.text());

  const items = await res.json();
  const ids = items
    .filter((i: any) => i.status === "pending")
    .map((i: any) => `"${i.id}"`)
    .join(",");

  if (!ids) return;

  await fetch(`${SUPABASE_URL}/rest/v1/order_items?id=in.(${ids})`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ status }),
  });
}
