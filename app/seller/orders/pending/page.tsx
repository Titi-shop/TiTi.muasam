"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

/* =====================================================
   TYPES
===================================================== */

interface Buyer {
  name: string;
  phone: string;
  address: string;
}

interface Product {
  id: string;
  name: string;
  images: string[];
}

interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
  product?: Product;
}

interface Order {
  id: string;
  status: string;
  total: number;
  created_at: string;
  buyer: Buyer;
  order_items: OrderItem[];
}

/* =====================================================
   HELPERS
===================================================== */

function formatPi(value: number): string {
  return Number(value).toFixed(6);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString("vi-VN");
}

/* =====================================================
   PAGE
===================================================== */

export default function SellerPendingOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  /* =====================================================
     LOAD ORDERS
  ===================================================== */

  useEffect(() => {
    void loadOrders();
  }, []);

  async function loadOrders(): Promise<void> {
    try {
      const res = await apiAuthFetch(
        "/api/seller/orders?status=pending",
        { cache: "no-store" }
      );

      if (!res.ok) throw new Error("LOAD_FAILED");

      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("LOAD ERROR:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     PRINT
  ===================================================== */

  function handlePrint(): void {
    window.print();
  }

  /* =====================================================
     DOWNLOAD TXT
  ===================================================== */

  function handleDownload(order: Order): void {
    const content = `
MÃ ĐƠN: ${order.id}
Ngày: ${formatDate(order.created_at)}

KHÁCH HÀNG:
Tên: ${order.buyer.name}
SĐT: ${order.buyer.phone}
Địa chỉ: ${order.buyer.address}

SẢN PHẨM:
${order.order_items
  .map(
    (item) =>
      `- ${item.product?.name ?? "Sản phẩm"} x${
        item.quantity
      } - π${formatPi(item.price)}`
  )
  .join("\n")}

TỔNG: π${formatPi(order.total)}
`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `order-${order.id}.txt`;
    a.click();

    URL.revokeObjectURL(url);
  }

  /* =====================================================
     UI
  ===================================================== */

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f4efe6]">
        <p className="text-gray-600">Đang tải...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4efe6] pb-24">
      {/* ===== HEADER (MỆNH THỔ) ===== */}
      <header className="bg-[#8B5E3C] text-white px-6 py-6 shadow-md">
        <p className="text-sm opacity-90">
          Đơn hàng chờ xác nhận
        </p>
        <p className="text-xl font-semibold mt-1">
          {orders.length} đơn
        </p>
      </header>

      {/* ===== LIST ===== */}
      <section className="px-4 mt-6 space-y-4">
        {orders.length === 0 ? (
          <p className="text-center text-gray-500">
            Không có đơn chờ xác nhận
          </p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="bg-white rounded-lg shadow border cursor-pointer hover:shadow-md transition"
            >
              <div className="flex justify-between px-4 py-3 border-b">
                <div>
                  <p className="font-semibold">
                    #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(order.created_at)}
                  </p>
                </div>

                <span className="text-[#8B5E3C] font-medium">
                  Chờ xác nhận
                </span>
              </div>

              <div className="px-4 py-3 text-sm">
                Tổng:{" "}
                <b>π{formatPi(order.total)}</b>
              </div>
            </div>
          ))
        )}
      </section>

      {/* ===== DETAIL MODAL ===== */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">
              Chi tiết đơn #{selectedOrder.id.slice(0, 8)}
            </h2>

            <div className="text-sm space-y-1 mb-4">
              <p><b>Khách:</b> {selectedOrder.buyer.name}</p>
              <p><b>SĐT:</b> {selectedOrder.buyer.phone}</p>
              <p><b>Địa chỉ:</b> {selectedOrder.buyer.address}</p>
            </div>

            <div className="border-t pt-3 space-y-2 text-sm">
              {selectedOrder.order_items.map((item) => (
                <div key={item.product_id}>
                  {item.product?.name ?? "Sản phẩm"} x
                  {item.quantity}
                </div>
              ))}
            </div>

            <p className="mt-4 font-semibold">
              Tổng: π{formatPi(selectedOrder.total)}
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-[#8B5E3C] text-white rounded"
              >
                In đơn
              </button>

              <button
                onClick={() => handleDownload(selectedOrder)}
                className="px-4 py-2 border border-[#8B5E3C] text-[#8B5E3C] rounded"
              >
                Lưu về máy
              </button>

              <button
                onClick={() => setSelectedOrder(null)}
                className="ml-auto text-gray-500"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
