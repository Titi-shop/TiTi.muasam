
// =====================================================
// app/account/wallet/components/WalletDefaultAddress.tsx
// =====================================================

"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
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

  onClick?: () => void;
};

/* =====================================================
   COMPONENT
===================================================== */

export default function WalletDefaultAddress({
  wallet,
  onClick,
}: Props) {

  const { t } =
    useTranslation();

  return (

    <button
      type="button"
      onClick={onClick}
      className="
        card
        mt-5
        flex
        w-full
        items-center
        justify-between
        gap-4
        px-4
        py-3
        text-left
        active:scale-[0.98]
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

        <div className="min-w-0 flex-1">

          <p
            className="
              text-xs
              text-muted
            "
          >
            {t.wallet_default ??
              "Default Wallet"}
          </p>

          <p
            className="
              mt-1
              truncate
              text-sm
              font-semibold
            "
            style={{
              color:
                "var(--text-primary)",
            }}
          >

            {wallet
              ? formatWalletAddress(
                  wallet.address
                )
              : (
                  t.wallet_not_linked ??
                  "No wallet linked"
                )}

          </p>

          {wallet && (

            <div
              className="
                mt-1
                flex
                items-center
                gap-1
                text-xs
              "
            >

              {wallet.is_verified ? (

                <>

                  <CheckCircle2
                    size={12}
                    className="
                      text-success
                    "
                  />

                  <span
                    className="
                      text-success
                    "
                  >
                    {t.wallet_verified ??
                      "Verified"}
                  </span>

                </>

              ) : (

                <>

                  <AlertCircle
                    size={12}
                    className="
                      text-warning
                    "
                  />

                  <span
                    className="
                      text-warning
                    "
                  >
                    {t.wallet_unverified ??
                      "Unverified"}
                  </span>

                </>

              )}

            </div>

          )}

        </div>

      </div>

      {/* ================= RIGHT ================= */}

      <ChevronRight
        size={18}
        className="
          shrink-0
          text-muted
        "
      />

    </button>

  );

}
