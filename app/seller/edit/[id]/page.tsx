"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

interface OrderItem {
  productName: string;
  quantity: number;
}

interface OrderDetail {
  id: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  province: string;
  country: string;
  createdAt: string;
  items: OrderItem[];
}

export default function SellerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  /* ================= AUTH GUARD ================= */

  useEffect(() => {
    if (authLoading) return;

    if (!user || (user.role !== "seller" && user.role !== "admin")) {
      router.replace("/account");
    }
  }, [authLoading, user, router]);

  /* ================= LOAD ORDER ================= */

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (!id) return;

    const loadOrder = async () => {
      try {
        setLoading(true);

        const res = await apiAuthFetch(
          `/api/seller/orders/${id}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          throw new Error("LOAD_FAILED");
        }

        const data = await res.json();
        setOrder(data);
      } catch (err) {
        console.error("ORDER DETAIL ERROR:", err);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [authLoading, user, id]);

  /* ================= UI ================= */

  if (authLoading || loading) {
    return (
      <main className="p-8 text-center">
        Đang tải đơn hàng...
      </main>
    );
  }

  if (!order) {
    return (
      <main className="p-8 text-center text-red-600">
        Không tìm thấy đơn hàng
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center text-[#ff6600]">
        📦 Chi tiết đơn hàng
      </h1>

      {/* Buyer Info */}
      <div className="border rounded-lg p-4 space-y-2 bg-white shadow">
        <h2 className="font-semibold text-lg">Thông tin người mua</h2>
        <p><strong>Tên:</strong> {order.buyerName}</p>
        <p><strong>Số điện thoại:</strong> {order.buyerPhone}</p>
        <p><strong>Địa chỉ:</strong> {order.buyerAddress}</p>
        <p><strong>Tỉnh/Thành:</strong> {order.province}</p>
        <p><strong>Quốc gia:</strong> {order.country}</p>
        <p>
          <strong>Ngày tạo:</strong>{" "}
          {new Date(order.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Products */}
      <div className="border rounded-lg p-4 space-y-3 bg-white shadow">
        <h2 className="font-semibold text-lg">Sản phẩm</h2>

        {order.items.map((item, index) => (
          <div
            key={index}
            className="flex justify-between border-b pb-2"
          >
            <span>{item.productName}</span>
            <span>x {item.quantity}</span>
          </div>
        ))}
      </div>

      {/* Print Button */}
      <button
        onClick={() => window.print()}
        className="w-full bg-[#ff6600] text-white py-3 rounded-lg font-semibold"
      >
        🖨 In đơn hàng
      </button>
    </main>
  );
}
