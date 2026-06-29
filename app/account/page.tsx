// =====================================================
// app/account/page.tsx
// =====================================================

"use client";

export const dynamic = "force-dynamic";

import {
  useEffect,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  LogOut,
} from "lucide-react";

import {
  useAuth,
} from "@/context/AuthContext";

import {
  useTranslationClient as useTranslation,
} from "@/app/lib/i18n/client";

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
     REDIRECT TO LOGIN
  =================================================== */

  useEffect(() => {

    if (
      !loading &&
      piReady &&
      !user
    ) {

      router.replace(
        "/pilogin"
      );

    }

  }, [
    loading,
    piReady,
    user,
    router,
  ]);

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
     WAIT REDIRECT
  =================================================== */

  if (!user) {

    return null;

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
        backgroundColor:
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
            text-white
            font-semibold
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
