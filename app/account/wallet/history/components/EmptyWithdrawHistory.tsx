// =====================================================
// app/account/wallet/history/components/EmptyWithdrawHistory.tsx
// =====================================================

"use client";

import {
  Inbox,
} from "lucide-react";

import {
  useTranslationClient as useTranslation,
} from "@/app/lib/i18n/client";

/* =====================================================
   COMPONENT
===================================================== */

export default function EmptyWithdrawHistory() {

  const { t } =
    useTranslation();

  return (

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

      {/* ================= ICON ================= */}

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

        <Inbox
          size={36}
        />

      </div>

      {/* ================= TITLE ================= */}

      <h2
        className="
          mt-6
          text-lg
          font-bold
        "
      >
        {t.no_withdraw_history ??
          "No withdrawal requests"}
      </h2>

      {/* ================= DESCRIPTION ================= */}

      <p
        className="
          mt-2
          max-w-sm
          text-sm
          leading-6
          text-muted
        "
      >
        {t.no_withdraw_history_desc ??
          "When you submit a withdrawal request, its status and details will appear here."}
      </p>

    </section>

  );

}
