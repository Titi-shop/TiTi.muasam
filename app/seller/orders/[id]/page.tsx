"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

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

interface Order {
  id: string;
  created_at: string;
  order_items: OrderItem[];
}

/* =========================
   HELPERS
========================= */

function formatDate(date: string): string {
  return new Date(date).toLocaleString("vi-VN");
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
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

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
        ⏳ Đang tải đơn hàng...
      </p>
    );
  }

  if (!order) {
    return (
      <p className="text-center mt-10 text-red-500">
        ❌ Không tìm thấy đơn hàng
      </p>
    );
  }

  /* ===== CONTENT FOR DOWNLOAD ===== */

  const downloadContent = `
ĐƠN HÀNG: ${order.id}
Ngày tạo: ${formatDate(order.created_at)}

SẢN PHẨM:
${order.order_items
  .map(
    (item, idx) =>
      `${idx + 1}. ${item.product?.name ?? "Sản phẩm"} x${item.quantity}`
  )
  .join("\n")}
`;

  return (
    <main className="min-h-screen bg-[#f4efe6] p-6 print:bg-white">

      {/* ORDER PAPER */}
      <section
        id="print-area"
        className="max-w-2xl mx-auto bg-white p-6 border shadow print:shadow-none"
      >
        <h1 className="text-xl font-semibold text-center mb-4">
          PHIẾU ĐƠN HÀNG
        </h1>

        <p className="text-sm text-center mb-6">
          Mã đơn: {order.id} <br />
          Ngày tạo: {formatDate(order.created_at)}
        </p>

        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1 text-left">#</th>
              <th className="border px-2 py-1 text-left">Sản phẩm</th>
              <th className="border px-2 py-1 text-center">SL</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items.map((item, i) => (
              <tr key={i}>
                <td className="border px-2 py-1">{i + 1}</td>
                <td className="border px-2 py-1">
                  {item.product?.name ?? "Sản phẩm"}
                </td>
                <td className="border px-2 py-1 text-center">
                  {item.quantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ACTION BUTTONS BELOW ORDER */}
      <div className="max-w-2xl mx-auto mt-6 flex justify-end gap-3 print:hidden">
        <button
          onClick={() =>
            downloadText(`order-${order.id}.txt`, downloadContent)
          }
          className="px-4 py-2 border border-[#7a553a] text-[#7a553a] rounded"
        >
          💾 Lưu
        </button>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-[#7a553a] text-white rounded"
        >
          🖨 In
        </button>
      </div>

      {/* PRINT STYLE */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }

          #print-area,
          #print-area * {
            visibility: visible;
          }

          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
