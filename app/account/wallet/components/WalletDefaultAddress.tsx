
// =====================================================
// app/account/wallet/components/WalletDefaultAddress.tsx
// =====================================================

"use client";

import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Wallet,
} from "lucide-react";

import {
  useTranslationClient as useTranslation,
} from "@/app/lib/i18n/client";

import {
  formatWalletAddress,
} from "../wallet.utils";

/* =====================================================
   TYPES
===================================================== */

type Props = {
  wallet: {
    address: string;
    network: string;
    is_verified: boolean;
  } | null;
};

/* =====================================================
   COMPONENT
===================================================== */

export default function WalletDefaultAddress({
  wallet,
}: Props) {

  const { t } = useTranslation();

  /* ===================================================
     NO WALLET
  =================================================== */

  if (!wallet) {

    return null;

  }

  /* ===================================================
     COPY ADDRESS
  =================================================== */

  const copyAddress = async () => {

    try {

      await navigator.clipboard.writeText(
        wallet.address
      );

    } catch {

      const textarea =
        document.createElement("textarea");

      textarea.value =
        wallet.address;

      document.body.appendChild(
        textarea
      );

      textarea.select();

      document.execCommand(
        "copy"
      );

      document.body.removeChild(
        textarea
      );

    }

  };

  /* ===================================================
     UI
  =================================================== */

  return (

    <div
      className="
        card
        mt-5
        flex
        items-center
        justify-between
        gap-4
        px-4
        py-3
      "
    >

      {/* ================= LEFT ================= */}

      <div
        className="
          flex
          min-w-0
          flex-1
          items-center
          gap-3
        "
      >

        {/* ICON */}

        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-primary/10
            text-primary
          "
        >

          <Wallet
            size={18}
          />

        </div>

        {/* CONTENT */}

        <div
          className="
            min-w-0
            flex-1
          "
        >

          {/* ADDRESS */}

          <p
            className="
              truncate
              text-sm
              font-semibold
            "
            style={{
              color:
                "var(--text-primary)",
            }}
          >

            {formatWalletAddress(
              wallet.address
            )}

          </p>

          {/* STATUS */}

          <div
            className="
              mt-2
              flex
              items-center
            "
          >

            {wallet.is_verified ? (

              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  bg-emerald-500/10
                  px-2.5
                  py-1
                  text-xs
                  font-medium
                  text-emerald-600
                  dark:text-emerald-400
                "
              >

                <CheckCircle2
                  size={13}
                />

                {t.wallet_verified ??
                  "Đã xác minh"}

              </span>

            ) : (

              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  bg-amber-500/10
                  px-2.5
                  py-1
                  text-xs
                  font-medium
                  text-amber-600
                  dark:text-amber-400
                "
              >

                <AlertCircle
                  size={13}
                />

                {t.wallet_unverified ??
                  "Chưa xác minh"}

              </span>

            )}

          </div>

        </div>

      </div>

      {/* ================= COPY ================= */}

      <button
        type="button"
        onClick={copyAddress}
        title={
          t.copy ??
          "Copy"
        }
        aria-label={
          t.copy ??
          "Copy"
        }
        className="
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-xl
          border
          border-border
          bg-background
          text-muted
          transition-all
          hover:bg-muted/40
          active:scale-95
        "
      >

        <Copy
          size={18}
        />

      </button>

    </div>

  );

}
