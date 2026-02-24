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
  return new Date(date).toLocaleString();
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
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  /* LOAD ORDER */
  useEffect(() => {
    loadOrder();
  }, []);

  async function loadOrder(): Promise<void> {
    try {
      const res = await apiAuthFetch(
        `/api/seller/orders/${params.id}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrder(data as Order);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-500">
          {t.loading_order ?? "Loading order..."}
      </p>
    );
  }

  if (!order) {
    return (
      <p className="text-center mt-10 text-red-500">
        {t.order_not_found ?? "Order not found"}
      </p>
    );
  }

  /* PREPARE DOWNLOAD CONTENT */
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
      `${idx + 1}. ${item.product?.name ?? (t.product ?? "Product")} x${
        item.quantity
      }`
  )
  .join("\n")}
`;

  return (
    <main className="min-h-screen bg-[#f4efe6] p-6 print:bg-white">
      {/* ACTION BAR (NOT PRINTED) */}
      <div className="flex justify-between items-center mb-6 print:hidden">

        <div className="flex gap-2">
          <button
            onClick={() =>
              downloadText(
                `order-${order.id}.txt`,
                downloadContent
              )
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
      </div>

      {/* ORDER PAPER */}
      <section className="max-w-2xl mx-auto bg-white p-6 border shadow print:shadow-none">
        <h1 className="text-xl font-semibold text-center mb-6">
          {t.delivery_note ?? "Delivery Note"}
        </h1>

        {/* BUYER INFO */}
        <div className="space-y-1 text-sm mb-6">
          <p>
            <b>Người nhận:</b> {order.buyer.name}
          </p>
          <p>
            <b>SĐT:</b> {order.buyer.phone ?? ""}
          </p>
          <p>
            <b>Địa chỉ:</b> {order.buyer.address ?? ""}
          </p>
          <p>
            <b>Tỉnh/TP:</b> {order.buyer.province ?? ""}
          </p>
          <p>
            <b>Quốc gia:</b> {order.buyer.country ?? ""}
          </p>
          <p>
            <b>Ngày tạo:</b>{" "}
            {formatDate(order.created_at)}
          </p>
        </div>

        {/* ITEMS */}
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1 text-left">
                #
              </th>
              <th className="border px-2 py-1 text-left">
                Sản phẩm
              </th>
              <th className="border px-2 py-1 text-center">
                SL
              </th>
            </tr>
          </thead>
          <tbody>
            {order.order_items.map((item, i) => (
              <tr key={i}>
                <td className="border px-2 py-1">
                  {i + 1}
                </td>
                <td className="border px-2 py-1">
                  {item.product?.name ??
                    "Sản phẩm"}
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
