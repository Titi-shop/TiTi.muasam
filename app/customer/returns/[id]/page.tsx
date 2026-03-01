"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type ReturnRecord = {
  id: string;
  order_id: string;
  status: string;
  reason: string;
  images: string[];
  seller_note: string | null;
  return_tracking_code: string | null;
  return_shipping_address: string | null;
  created_at: string;
  refunded_at: string | null;
};

const STATUS_STEPS = [
  "pending",
  "approved",
  "shipped",
  "received",
  "refunded",
];

export default function ReturnDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [data, setData] = useState<ReturnRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingCode, setTrackingCode] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/returns/${id}`)
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setTrackingCode(res.return_tracking_code || "");
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmitTracking() {
    if (!trackingCode) return;

    setSaving(true);
    await fetch(`/api/returns/${id}/ship`, {
      method: "POST",
      body: JSON.stringify({ trackingCode }),
    });

    location.reload();
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (!data) return <div className="p-6">Not found</div>;

  const currentStepIndex = STATUS_STEPS.indexOf(data.status);

  return (
    <main className="min-h-screen bg-gray-50 pb-16">

      {/* HEADER */}
      <div className="flex items-center bg-white p-4 shadow-sm">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="mx-auto font-semibold text-lg">
          Return #{data.id}
        </h1>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-6">

        {/* TIMELINE */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex justify-between text-xs">
            {STATUS_STEPS.map((step, index) => (
              <div key={step} className="flex flex-col items-center flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px]
                    ${index <= currentStepIndex ? "bg-orange-500" : "bg-gray-300"}`}
                >
                  {index + 1}
                </div>
                <span className="mt-2 capitalize text-center">
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* BASIC INFO */}
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
          <p><b>Order:</b> {data.order_id}</p>
          <p><b>Reason:</b> {data.reason}</p>

          {data.images?.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {data.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  className="w-full h-24 object-cover rounded border"
                />
              ))}
            </div>
          )}
        </div>

        {/* STATUS CONTENT */}

        {data.status === "pending" && (
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-orange-600 font-medium">
              Waiting for seller approval...
            </p>
          </div>
        )}

        {data.status === "rejected" && (
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-red-600 font-medium">
              Request rejected
            </p>
            {data.seller_note && (
              <p className="text-sm text-gray-600 mt-2">
                Seller note: {data.seller_note}
              </p>
            )}
          </div>
        )}

        {data.status === "approved" && (
          <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
            <p className="font-semibold text-green-600">
              Approved - Please ship the item back
            </p>

            <div className="bg-gray-100 p-3 rounded text-sm">
              <b>Return Address:</b><br />
              {data.return_shipping_address}
            </div>

            <input
              type="text"
              placeholder="Enter tracking code"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              className="w-full border p-3 rounded-lg"
            />

            <button
              onClick={handleSubmitTracking}
              disabled={saving}
              className="w-full bg-orange-500 text-white py-2 rounded-lg"
            >
              Confirm Shipment
            </button>
          </div>
        )}

        {data.status === "shipped" && (
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="font-semibold text-blue-600">
              Item shipped
            </p>
            <p className="text-sm mt-2">
              Tracking code: {data.return_tracking_code}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Waiting seller to confirm receipt...
            </p>
          </div>
        )}

        {data.status === "received" && (
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="font-semibold text-purple-600">
              Seller received item
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Refund is being processed...
            </p>
          </div>
        )}

        {data.status === "refunded" && (
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="font-semibold text-green-700">
              Refund completed
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Refunded at: {data.refunded_at}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
