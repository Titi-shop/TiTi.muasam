// =====================================================
// app/account/wallet/components/WalletAddressCard.tsx
// =====================================================

"use client";

import {
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Wallet,
} from "lucide-react";

import type {
  WalletAddress,
} from "../wallet.types";

import {
  formatWalletAddress,
} from "../wallet.utils";

/* =====================================================
   TYPES
===================================================== */

type Props = {

  wallet:
    WalletAddress | null;

  onClick?: () => void;

};

/* =====================================================
   COMPONENT
===================================================== */

export default function WalletAddressCard({

  wallet,

  onClick,

}: Props) {

  return (

    <button
      type="button"
      onClick={onClick}
      className="
        w-full
        rounded-2xl
        border
        border-[var(--nav-border)]
        bg-[var(--card-bg)]
        p-4
        transition-all
        active:scale-[0.98]
      "
    >

      <div
        className="
          flex
          items-center
          justify-between
          gap-4
        "
      >

        {/* LEFT */}

        <div
          className="
            flex
            items-center
            gap-3
          "
        >

          <div
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-xl
              bg-primary/10
              text-primary
            "
          >

            <Wallet
              size={20}
            />

          </div>

          <div
            className="
              text-left
            "
          >

            <p
              className="
                text-xs
                text-[var(--text-muted)]
              "
            >
              Wallet Address
            </p>

            <p
              className="
                mt-1
                font-semibold
                text-[var(--foreground)]
              "
            >

              {wallet
                ? formatWalletAddress(
                    wallet.address
                  )
                : "Select wallet"}

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

                {wallet.isVerified ? (

                  <>

                    <CheckCircle2
                      size={13}
                      className="
                        text-green-500
                      "
                    />

                    <span
                      className="
                        text-green-500
                      "
                    >
                      Verified
                    </span>

                  </>

                ) : (

                  <>

                    <AlertCircle
                      size={13}
                      className="
                        text-yellow-500
                      "
                    />

                    <span
                      className="
                        text-yellow-500
                      "
                    >
                      Unverified
                    </span>

                  </>

                )}

              </div>

            )}

          </div>

        </div>

        {/* RIGHT */}

        <ChevronRight
          size={18}
          className="
            text-[var(--text-muted)]
          "
        />

      </div>

    </button>

  );

}
