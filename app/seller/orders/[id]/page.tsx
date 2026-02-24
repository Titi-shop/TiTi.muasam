"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* =========================
   TYPES
========================= */

interface Product {
  name: string;
}

interface OrderItem {
  quantity: number;
  product?: Product;
}

interface Buyer {
  name: string;
  phone?: string;
  address?: string;
  province?: string;
  country?: string;
}

interface Order {
  id: string;
  created_at: string;
  buyer: Buyer;
  order_items: OrderItem[];
}

/* =========================
   HELPERS
========================= */

function formatDate(date: string): string {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function downloadText(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* =========================
   PAGE
========================= */

export default function SellerOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { t } = useTranslation();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ================= */

  useEffect(() => {
    void loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadOrder(): Promise<void> {
    try {
      const res = await apiAuthFetch(
        `/api/seller/orders/${params.id}`,
        { cache: "no-store" }
      );

      if (!res.ok) throw new Error("LOAD_FAILED");

      const data = await res.json();
      setOrder(data as Order);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  /* ================= STATES ================= */

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ {t.loading_order ?? "Loading order..."}
      </p>
    );
  }

  if (!order) {
    return (
      <p className="text-center mt-10 text-red-500">
        ❌ {t.order_not_found ?? "Order not found"}
      </p>
    );
  }

  /* ================= DOWNLOAD CONTENT ================= */

  const downloadContent = `
${t.order ?? "ORDER"}: ${order.id}
${t.created_at ?? "Created at"}: ${formatDate(order.created_at)}

${t.receiver ?? "Receiver"}:
${t.name ?? "Name"}: ${order.buyer.name}
${t.phone ?? "Phone"}: ${order.buyer.phone ?? ""}
${t.address ?? "Address"}: ${order.buyer.address ?? ""}
${t.province ?? "Province"}: ${order.buyer.province ?? ""}
${t.country ?? "Country"}: ${order.buyer.country ?? ""}

${t.products ?? "Products"}:
${order.order_items
  .map(
    (item, idx) =>
      `${idx + 1}. ${
        item.product?.name ?? (t.product ?? "Product")
      } x${item.quantity}`
  )
  .join("\n")}
`;

  /* ================= UI ================= */

  return (
    <main className="min-h-screen bg-[#f4efe6] p-6 print:bg-white">
      {/* ACTION BAR (HIDDEN WHEN PRINTING) */}
      <div className="flex justify-end gap-2 mb-6 print:hidden">
        <button
          onClick={() =>
            downloadText(`order-${order.id}.txt`, downloadContent)
          }
          className="px-4 py-2 border border-[#7a553a] text-[#7a553a] rounded"
        >
          💾 {t.download ?? "Download"}
        </button>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-[#7a553a] text-white rounded"
        >
          🖨 {t.print ?? "Print"}
        </button>
      </div>

      {/* ORDER PAPER */}
      <section className="max-w-2xl mx-auto bg-white p-6 border shadow print:shadow-none">
        <h1 className="text-xl font-semibold text-center mb-6">
          {t.delivery_note ?? "Delivery Note"}
        </h1>

        {/* BUYER INFO */}
        <div className="space-y-1 text-sm mb-6">
          <p>
            <b>{t.receiver ?? "Receiver"}:</b> {order.buyer.name}
          </p>
          <p>
            <b>{t.phone ?? "Phone"}:</b> {order.buyer.phone ?? ""}
          </p>
          <p>
            <b>{t.address ?? "Address"}:</b> {order.buyer.address ?? ""}
          </p>
          <p>
            <b>{t.province ?? "Province"}:</b> {order.buyer.province ?? ""}
          </p>
          <p>
            <b>{t.country ?? "Country"}:</b> {order.buyer.country ?? ""}
          </p>
          <p>
            <b>{t.created_at ?? "Created at"}:</b>{" "}
            {formatDate(order.created_at)}
          </p>
        </div>

        {/* ITEMS TABLE */}
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1 text-left">#</th>
              <th className="border px-2 py-1 text-left">
                {t.product ?? "Product"}
              </th>
              <th className="border px-2 py-1 text-center">
                {t.quantity ?? "Qty"}
              </th>
            </tr>
          </thead>
          <tbody>
            {order.order_items.map((item, i) => (
              <tr key={i}>
                <td className="border px-2 py-1">{i + 1}</td>
                <td className="border px-2 py-1">
                  {item.product?.name ??
                    (t.product ?? "Product")}
                </td>
                <td className="border px-2 py-1 text-center">
                  {item.quantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
