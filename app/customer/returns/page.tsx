"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Send } from "lucide-react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

interface Order {
  id: string;
  status: string;
}

const RETURN_REASONS = [
  "Hàng bị lỗi",
  "Sai sản phẩm",
  "Thiếu hàng",
  "Không đúng mô tả",
  "Giao hàng trễ",
  "Khác",
];

export default function ReturnPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState("");
  const [reason, setReason] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  /* LOAD RETURNABLE ORDERS */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiAuthFetch(
          "/api/orders?returnable=true",
          { cache: "no-store" }
        );

        if (!res.ok) throw new Error();

        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* UPLOAD */
  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await apiAuthFetch("/api/upload", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (data?.url) {
        setImages(prev => [...prev, data.url]);
      }
    } finally {
      setUploading(false);
    }
  };

  /* SUBMIT */
  const handleSubmit = async () => {
    if (!selectedOrder || !reason || images.length === 0) {
      alert("Vui lòng chọn đơn, lý do và tải ảnh");
      return;
    }

    setSubmitting(true);

    try {
      const res = await apiAuthFetch("/api/returns", {
        method: "POST",
        body: JSON.stringify({
          orderId: selectedOrder,
          reason,
          images,
        }),
      });

      if (!res.ok) throw new Error();

      alert("Đã gửi yêu cầu hoàn trả");
      router.push("/customer/orders");
    } catch {
      alert("Gửi yêu cầu thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-center mt-10">⏳ Đang tải...</p>;
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <div className="flex items-center bg-white p-4 shadow-sm">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="mx-auto font-semibold">
          Yêu cầu hoàn trả
        </h1>
      </div>

      <div className="p-4">
        <label className="font-semibold">Chọn đơn</label>
        <select
          className="w-full border p-2 rounded mt-2"
          value={selectedOrder}
          onChange={(e) => setSelectedOrder(e.target.value)}
        >
          <option value="">-- Chọn --</option>
          {orders.map(o => (
            <option key={o.id} value={o.id}>
              #{o.id}
            </option>
          ))}
        </select>

        {orders.length === 0 && (
          <p className="text-sm text-gray-400 mt-2">
            Không có đơn đủ điều kiện hoàn trả
          </p>
        )}
      </div>

      <div className="p-4">
        <label className="font-semibold">Lý do</label>
        <select
          className="w-full border p-2 rounded mt-2"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          <option value="">-- Chọn lý do --</option>
          {RETURN_REASONS.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="p-4">
        <label className="font-semibold">Ảnh minh chứng</label>
        <label className="flex gap-2 bg-orange-500 text-white px-4 py-2 rounded mt-2 cursor-pointer w-fit">
          <Upload size={18} />
          {uploading ? "Đang upload..." : "Tải ảnh"}
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleUpload}
          />
        </label>

        {images.length > 0 && (
          <div className="flex gap-3 mt-3 flex-wrap">
            {images.map((url, i) => (
              <img
                key={i}
                src={url}
                className="w-20 h-20 object-cover rounded border"
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-center mt-6">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-green-600 text-white px-6 py-2 rounded"
        >
          <Send size={18} className="inline mr-2" />
          {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
        </button>
      </div>
    </main>
  );
}
