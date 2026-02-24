"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Send } from "lucide-react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

/* =========================
   TYPES
========================= */
interface Order {
  id: string;
  status: string;
}

const RETURN_REASON_KEYS = [
  "return_reason_defective",
  "return_reason_wrong_item",
  "return_reason_missing_item",
  "return_reason_not_as_described",
  "return_reason_late_delivery",
  "return_reason_other",
];

/* =========================
   PAGE
========================= */
export default function ReturnPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  /* =========================
     LOAD RETURNABLE ORDERS
  ========================= */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiAuthFetch(
          "/api/orders?returnable=true",
          { cache: "no-store" }
        );

        if (!res.ok) throw new Error("LOAD_FAILED");

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

  /* =========================
     UPLOAD IMAGE
  ========================= */
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

      if (!res.ok) throw new Error("UPLOAD_FAILED");

      const data = await res.json();
      if (data?.url) {
        setImages((prev) => [...prev, data.url]);
      }
    } finally {
      setUploading(false);
    }
  };

  /* =========================
     SUBMIT RETURN
  ========================= */
  const handleSubmit = async () => {
    if (!selectedOrder || !reason || images.length === 0) {
      alert(t.return_validation_error);
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

      if (!res.ok) throw new Error("RETURN_FAILED");

      alert(t.return_submitted);
      router.push("/customer/orders");
    } catch {
      alert(t.return_failed);
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     LOADING
  ========================= */
  if (loading) {
    return (
      <p className="text-center mt-10">
        {t.loading}
      </p>
    );
  }

  /* =========================
     UI
  ========================= */
  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      {/* HEADER */}
      <div className="flex items-center bg-white p-4 shadow-sm">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="mx-auto font-semibold">
          {t.return_request}
        </h1>
      </div>

      {/* SELECT ORDER */}
      <div className="p-4">
        <label className="font-semibold">
          {t.select_order}
        </label>

        <select
          className="w-full border p-2 rounded mt-2"
          value={selectedOrder}
          onChange={(e) => setSelectedOrder(e.target.value)}
        >
          <option value="">
            -- {t.select} --
          </option>

          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              #{o.id}
            </option>
          ))}
        </select>

        {orders.length === 0 && (
          <p className="text-sm text-gray-400 mt-2">
            {t.no_returnable_orders}
          </p>
        )}
      </div>

      {/* REASON */}
      <div className="p-4">
        <label className="font-semibold">
          {t.reason}
        </label>

        <select
          className="w-full border p-2 rounded mt-2"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          <option value="">
            -- {t.select_reason} --
          </option>

          {RETURN_REASON_KEYS.map((key) => (
            <option key={key} value={key}>
              {t[key]}
            </option>
          ))}
        </select>
      </div>

      {/* IMAGE UPLOAD */}
      <div className="p-4">
        <label className="font-semibold">
          {t.proof_images}
        </label>

        <label className="flex gap-2 bg-orange-500 text-white px-4 py-2 rounded mt-2 cursor-pointer w-fit">
          <Upload size={18} />
          {uploading ? t.uploading : t.upload_image}
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleUpload}
          />
        </label>

        {images.length > 0 && (
          <div className="flex gap-3 mt-3 flex-wrap">
            {images.map((url, index) => (
              <img
                key={index}
                src={url}
                className="w-20 h-20 object-cover rounded border"
                alt="proof"
              />
            ))}
          </div>
        )}
      </div>

      {/* SUBMIT */}
      <div className="flex justify-center mt-6">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-green-600 text-white px-6 py-2 rounded disabled:opacity-60"
        >
          <Send size={18} className="inline mr-2" />
          {submitting ? t.sending : t.submit_request}
        </button>
      </div>
    </main>
  );
}
