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
      <div className="text-xs text-gray-600">
        1 PI ={" "}
        <span className="text-orange-500 font-semibold">
          {price !== null
            ? price.toFixed(6)   // hiển thị 6 số thập phân
            : "..."}
        </span>{" "}
        USD
      </div>
    </div>
  );
}
