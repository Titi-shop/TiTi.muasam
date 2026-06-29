// =====================================================
// app/account/page.tsx
// =====================================================

"use client";

export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { LogOut, ArrowRight } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

import AccountHeader from "@/components/AccountHeader";
import OrderSummary from "@/components/OrderSummary";
import CustomerMenu from "@/components/customerMenu";

/* =====================================================
   PAGE
===================================================== */

export default function AccountPage() {

  const router =
    useRouter();

  const { t } =
    useTranslation();

  const {
    user,
    loading,
    logout,
    piReady,
  } = useAuth();

  /* ===================================================
     LOADING
  =================================================== */

  if (
    loading ||
    !piReady
  ) {

    return (

      <main
        className="
          min-h-screen
          p-4
          space-y-4
        "
      >

        {Array.from({
          length: 5,
        }).map((_, i) => (

          <div
            key={i}
            className="
              h-24
              rounded-2xl
              animate-pulse
              bg-gray-200
            "
          />

        ))}

      </main>

    );

  }

  /* ===================================================
     GUEST
  =================================================== */

  if (!user) {

    return (

      <main
        className="
          min-h-screen
          px-4
          py-8
          space-y-5
        "
        style={{
          background:
            "var(--background)",
        }}
      >

        <div
          className="
            rounded-3xl
            p-6
            border
            shadow-sm
          "
          style={{
            background:
              "var(--card-bg)",
            borderColor:
              "var(--border-color)",
          }}
        >

          <h1
            className="
              text-2xl
              font-bold
            "
          >
            {t.account}
          </h1>

          <p
            className="
              mt-2
              text-sm
              opacity-70
            "
          >
            Welcome to TITI Marketplace
          </p>

        </div>

        {/* MENU */}

        <div
          className="
            rounded-3xl
            border
            overflow-hidden
          "
          style={{
            background:
              "var(--card-bg)",
            borderColor:
              "var(--border-color)",
          }}
        >

          {[
            "Wallet",
            "Orders",
            "Seller Center",
            "Support",
          ].map((item) => (

            <div
              key={item}
              className="
                flex
                items-center
                justify-between
                px-5
                py-4
                border-b
                last:border-0
              "
              style={{
                borderColor:
                  "var(--border-color)",
              }}
            >

              <span>
                {item}
              </span>

              <ArrowRight
                size={18}
              />

            </div>

          ))}

        </div>

        {/* LOGIN */}

        <button
          onClick={() =>
            router.push(
              "/pilogin"
            )
          }
          className="
            h-14
            w-full
            rounded-2xl
            bg-orange-600
            text-white
            font-semibold
            transition
            active:scale-95
          "
        >
          Continue with Pi
        </button>

      </main>

    );

  }

  /* ===================================================
     MEMBER
  =================================================== */

  return (

    <main
      className="
        min-h-screen
        pb-28
        space-y-4
      "
      style={{
        background:
          "var(--background)",
      }}
    >

      <AccountHeader />

      <OrderSummary />

      <CustomerMenu />

      <section className="mx-4">

        <button
          onClick={logout}
          className="
            flex
            h-14
            w-full
            items-center
            justify-center
            gap-3
            rounded-2xl
            bg-red-500
            font-semibold
            text-white
            transition
            active:scale-95
          "
        >

          <LogOut
            size={20}
          />

          {t.logout}

        </button>

      </section>

    </main>

  );

}
