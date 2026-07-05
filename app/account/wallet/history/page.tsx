// =====================================================
// app/account/wallet/history/page.tsx
// =====================================================

"use client";

export const dynamic = "force-dynamic";

import {
  ArrowLeft,
  Clock3,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  useTranslationClient as useTranslation,
} from "@/app/lib/i18n/client";

/* =====================================================
   PAGE
===================================================== */

export default function WalletHistoryPage() {

  const router =
    useRouter();

  const { t } =
    useTranslation();

  return (

    <main
      className="
        min-h-screen
        bg-[var(--background)]
        pb-24
      "
    >

      {/* ==========================================
          HEADER
      ========================================== */}

      <header
        className="
          sticky
          top-0
          z-20
          flex
          items-center
          gap-3
          border-b
          border-border
          bg-background/95
          px-4
          py-4
          backdrop-blur
        "
      >

        <button
          type="button"
          onClick={() => {
            router.back();
          }}
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            transition
            hover:bg-muted
          "
        >

          <ArrowLeft
            size={20}
          />

        </button>

        <div>

          <h1
            className="
              text-lg
              font-bold
            "
          >
            {t.wallet_history ??
              "Withdrawal History"}
          </h1>

          <p
            className="
              text-sm
              text-muted
            "
          >
            {t.wallet_history_desc ??
              "View all withdrawal requests"}
          </p>

        </div>

      </header>

      {/* ==========================================
          FILTER
      ========================================== */}

      <div
        className="
          flex
          gap-2
          overflow-x-auto
          px-4
          py-4
        "
      >

        <button
          className="
            rounded-full
            bg-primary
            px-4
            py-2
            text-sm
            font-medium
            text-white
          "
        >
          {t.all ?? "All"}
        </button>

        <button
          className="
            rounded-full
            border
            border-border
            px-4
            py-2
            text-sm
          "
        >
          {t.pending ?? "Pending"}
        </button>

        <button
          className="
            rounded-full
            border
            border-border
            px-4
            py-2
            text-sm
          "
        >
          {t.completed ?? "Completed"}
        </button>

      </div>

      {/* ==========================================
          EMPTY
      ========================================== */}

      <section
        className="
          flex
          min-h-[55vh]
          flex-col
          items-center
          justify-center
          px-6
          text-center
        "
      >

        <div
          className="
            flex
            h-20
            w-20
            items-center
            justify-center
            rounded-full
            bg-primary/10
            text-primary
          "
        >

          <Clock3
            size={34}
          />

        </div>

        <h2
          className="
            mt-6
            text-lg
            font-semibold
          "
        >
          {t.no_withdraw_history ??
            "No withdrawal requests"}
        </h2>

        <p
          className="
            mt-2
            max-w-sm
            text-sm
            text-muted
          "
        >
          {t.no_withdraw_history_desc ??
            "Your withdrawal requests will appear here after you submit one."}
        </p>

      </section>

    </main>

  );

}
