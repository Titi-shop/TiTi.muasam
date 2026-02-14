"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { availableLanguages } from "@/app/lib/i18n";

type CartItem = {
  id: string;
  quantity: number;
};

export default function Navbar() {
  const { t, lang, setLang } = useTranslation();
  const [cartCount, setCartCount] = useState<number>(0);

  const updateCartCount = () => {
    const storedCart = localStorage.getItem("cart");

    if (!storedCart) {
      setCartCount(0);
      return;
    }

    try {
      const parsed: CartItem[] = JSON.parse(storedCart);
      const total = parsed.reduce(
        (sum: number, item: CartItem) => sum + item.quantity,
        0
      );
      setCartCount(total);
    } catch {
      setCartCount(0);
    }
  };

  useEffect(() => {
    updateCartCount();

    // Lắng nghe thay đổi giữa các tab
    window.addEventListener("storage", updateCartCount);

    // Lắng nghe thay đổi trong cùng tab
    window.addEventListener("cart-updated", updateCartCount);

    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cart-updated", updateCartCount);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 bg-orange-500 p-3 text-white flex justify-between items-center shadow-md z-50">
      
      <Link
        href="/cart"
        aria-label="Giỏ hàng"
        className="flex items-center gap-1 relative"
      >
        <ShoppingCart size={20} />
        <span>{t.cart || "Cart"}</span>

        {cartCount > 0 && (
          <span className="absolute -top-2 -right-3 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
            {cartCount}
          </span>
        )}
      </Link>

      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="bg-white text-black text-xs px-2 py-1 rounded"
      >
        {Object.entries(availableLanguages).map(([code, label]) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>

    </header>
  );
}
