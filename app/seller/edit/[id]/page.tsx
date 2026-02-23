"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

interface OrderItem {
  productName: string;
  quantity: number;
  price?: number;
}

interface OrderDetail {
  id: string;
  createdAt: string;
  status?: string;
  total?: number;
  items: OrderItem[];
}

export default function SellerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ORDER ================= */

  useEffect(() => {
    if (authLoading) return;
    if (!user || !id) return;

    const loadOrder = async () => {
      try {
        setLoading(true);

        const res = await apiAuthFetch(
          `/api/seller/orders/${id}`,
          { cache: "no-store" }
        );

        if (!res.ok) throw new Error();

        const data = await res.json();
        setOrder(data);
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [authLoading, user, id]);

  /* ================= DOWNLOAD PDF ================= */

  const handleDownload = async () => {
    const element = document.getElementById("print-area");
    if (!element) return;

    const html2canvas = (await import("html2canvas")).default;
    const jsPDF = (await import("jspdf")).default;

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const width = 210;
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save(`order-${order?.id}.pdf`);
  };

  /* ================= UI ================= */

  if (authLoading || loading) {
    return (
      <main className="p-6 text-center text-stone-500">
        ⏳ {t.loading ?? "Loading..."}
      </main>
    );
  }

  if (!order) {
    return (
      <main className="p-6 text-center text-red-500">
        {t.not_found ?? "Order not found"}
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-6 bg-amber-50 min-h-screen">

      {/* ================= ORDER CONTENT ================= */}
      <div
        id="print-area"
        className="bg-white rounded-xl shadow p-6 space-y-6"
      >
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold text-amber-700">
            {t.order_detail ?? "Order Detail"}
          </h1>

          <p className="text-xs text-stone-500">
            ID: {order.id}
          </p>

          <p className="text-xs text-stone-500">
            {new Date(order.createdAt).toLocaleString()}
          </p>

          {order.status && (
            <p className="text-sm font-medium text-amber-700 capitalize">
              {order.status}
            </p>
          )}
        </div>

        {/* ITEMS */}
        <div className="space-y-3">
          {order.items.map((item, index) => (
            <div
              key={index}
              className="flex justify-between border-b pb-2 text-sm"
            >
              <span>{item.productName}</span>
              <span>x {item.quantity}</span>
            </div>
          ))}
        </div>

        {/* TOTAL */}
        {order.total !== undefined && (
          <div className="flex justify-between text-sm font-semibold pt-4">
            <span>{t.total ?? "Total"}</span>
            <span>{order.total} π</span>
          </div>
        )}
      </div>

      {/* ================= ACTION BUTTONS ================= */}
      <div className="flex gap-3 justify-end no-print">
        <button
          onClick={handleDownload}
          className="px-4 py-2 rounded-lg bg-stone-700 text-white text-sm"
        >
          {t.download ?? "Download PDF"}
        </button>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-lg bg-amber-700 text-white text-sm"
        >
          {t.print ?? "Print"}
        </button>
      </div>

      {/* ================= PRINT STYLE ================= */}
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

          .no-print {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}
