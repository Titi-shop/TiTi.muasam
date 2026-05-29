"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { formatPi } from "@/lib/pi";

/* =====================================================
   TYPES
===================================================== */

interface Message {
  text: string;
  type: "error" | "success";
}

/* =====================================================
   PAGE
===================================================== */

export default function CartPage() {
  const router = useRouter();

  const { t } = useTranslation();

  const {
    cart,
    updateQty,
    removeFromCart,
  } = useCart();

  const {
    user,
    pilogin,
  } = useAuth();

  const [selectedIds, setSelectedIds] =
    useState<string[]>([]);

  const [message, setMessage] =
    useState<Message | null>(null);

  /* =====================================================
     MESSAGE
  ===================================================== */

  const showMessage = (
    text: string,
    type: "error" | "success" = "error"
  ) => {
    setMessage({
      text,
      type,
    });

    setTimeout(() => {
      setMessage(null);
    }, 4000);
  };

  /* =====================================================
     SELECTED ITEMS
  ===================================================== */

  const selectedItems = useMemo(
    () =>
      cart.filter((item) =>
        selectedIds.includes(item.id)
      ),
    [cart, selectedIds]
  );

  /* =====================================================
     TOTAL
  ===================================================== */

  const total = useMemo(() => {
    return selectedItems.reduce(
      (sum, item) => {
        const unit =
          typeof item.sale_price === "number"
            ? item.sale_price
            : item.price;

        return sum + unit * item.quantity;
      },
      0
    );
  }, [selectedItems]);

  /* =====================================================
     TOGGLE
  ===================================================== */

  const toggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  /* =====================================================
     CHECKOUT
  ===================================================== */

  const handleCheckout = () => {
    if (!user) {
      pilogin?.();

      showMessage(
        t.please_login ??
          "Please login first"
      );

      return;
    }

    if (selectedItems.length === 0) {
      showMessage(
        t.please_select_product ??
          "Please select product"
      );

      return;
    }

    if (selectedItems.length > 1) {
      showMessage(
        t.only_one_product_supported ??
          "Only 1 product supported"
      );

      return;
    }

    const item = selectedItems[0];

    if (!item) {
      return;
    }

    const productId =
      item.product_id ?? item.id;

    const variantId =
      item.variant_id ??
      item.variant?.id ??
      null;

    /* =====================================================
       REDIRECT TO PRODUCT CHECKOUT
    ===================================================== */

    router.push(
      `/product/${productId}` +
        `?checkout=1` +
        `&qty=${item.quantity}` +
        (variantId
          ? `&variant=${variantId}`
          : "")
    );
  };

  /* =====================================================
     EMPTY
  ===================================================== */

  if (cart.length === 0) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-6">
        <p className="mb-3 text-sm text-muted">
          {t.empty_cart ??
            "Cart is empty"}
        </p>

        <Link
          href="/"
          className="text-sm font-semibold text-primary"
        >
          {t.back_to_shop ??
            "Back to shop"}
        </Link>
      </main>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <main className="min-h-screen bg-[var(--background)] pb-40">
      {/* MESSAGE */}

      {message && (
        <div
          className={`fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl px-4 py-2 text-sm shadow-lg ${
            message.type === "error"
              ? "bg-red-500 text-white"
              : "bg-green-600 text-white"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* LIST */}

      <div className="bg-card">
        {cart.map((item) => {
          const unit =
            typeof item.sale_price === "number"
              ? item.sale_price
              : item.price;

          const hasSale =
            typeof item.sale_price === "number" &&
            item.sale_price < item.price;

          return (
            <div
              key={item.id}
              className="flex gap-3 border-b border-black/5 p-4"
            >
              {/* CHECKBOX */}

              <div className="pt-5">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(
                    item.id
                  )}
                  onChange={() =>
                    toggleItem(item.id)
                  }
                  className="h-4 w-4 accent-[var(--color-primary)]"
                />
              </div>

              {/* IMAGE */}

              <div className="relative">
                <Image
                  src={
                    item.thumbnail ||
                    "/placeholder.png"
                  }
                  alt={item.name}
                  width={88}
                  height={88}
                  className="h-[88px] w-[88px] rounded-xl border border-black/5 object-cover"
                />

                {hasSale && (
                  <div className="absolute left-0 top-0 rounded-br-lg bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    SALE
                  </div>
                )}
              </div>

              {/* CONTENT */}

              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold">
                  {item.name}
                </p>

                {/* PRICE */}

                <div className="mt-2 flex items-center gap-2">
                  {hasSale && (
                    <span className="text-xs text-muted line-through">
                      π
                      {formatPi(item.price)}
                    </span>
                  )}

                  <span className="pi-price text-sm">
                    π
                    {formatPi(unit)}
                  </span>
                </div>

                {/* QTY */}

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center overflow-hidden rounded-xl border border-black/10">
                    <button
                      onClick={() =>
                        updateQty(
                          item.id,
                          item.quantity - 1
                        )
                      }
                      disabled={item.quantity <= 1}
                      className="bg-gray-100 px-3 py-1 text-lg disabled:opacity-30"
                    >
                      −
                    </button>

                    <div className="px-4 text-sm font-semibold">
                      {item.quantity}
                    </div>

                    <button
                      onClick={() =>
                        updateQty(
                          item.id,
                          item.quantity + 1
                        )
                      }
                      className="bg-gray-100 px-3 py-1 text-lg"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="pi-price text-sm">
                      π
                      {formatPi(
                        unit * item.quantity
                      )}
                    </p>
                  </div>
                </div>

                {/* DELETE */}

                <button
                  onClick={() =>
                    removeFromCart(item.id)
                  }
                  className="mt-2 text-xs text-red-500"
                >
                  {t.delete ??
                    "Delete"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER */}

      <div className="fixed bottom-0 left-0 right-0 border-t border-black/5 bg-card px-5 pb-8 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-muted">
            {t.total ??
              "Total"}
          </span>

          <span className="pi-price text-lg">
            π{formatPi(total)}
          </span>
        </div>

        <button
          onClick={handleCheckout}
          className="
            w-full
            rounded-2xl
            bg-primary
            py-3
            text-sm
            font-bold
            text-white
            transition
            active:scale-95
          "
        >
          {t.pay_now ??
            "Checkout"}
        </button>
      </div>
    </main>
  );
              }
