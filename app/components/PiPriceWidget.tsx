"use client";
import { useEffect, useState } from "react";

export default function PiPriceWidget() {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("/api/pi-price", { cache: "no-store" });
        const data = await res.json();
        if (data.price_usd) {
          setPrice(Number(data.price_usd));
        }
      } catch (e) {
        console.error("Không thể lấy giá Pi:", e);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex justify-center">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-full shadow-lg text-sm font-semibold">
        💰 1 PI ={" "}
        {price !== null ? `${price.toFixed(2)} USD` : "Đang tải..."}
      </div>
    </div>
  );
}
