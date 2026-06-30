"use client";

import {
  ChevronRight,
  CheckCircle2,
  AlertCircle,
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
        mt-6
        w-full
        rounded-2xl
        border border-white/20
        bg-white/10
        backdrop-blur-md
        p-4
        transition
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
              bg-white/15
            "
          >

            <Wallet size={20} />

          </div>

          <div
            className="
              text-left
            "
          >

            <p
              className="
                text-xs
                text-muted
              "
            >
              {t.wallet_default}
            </p>

            <p
              className="
                mt-1
                font-semibold
                tracking-wide
              "
            >

              {wallet
                ? formatWalletAddress(
                    wallet.address
                  )
                : "{t.wallet_not_linked}"}

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
  size={13}
  className="text-success"
/>

                  <span className="text-success">
  {t.wallet_verified}
</span>

                  </>

                ) : (

                  <>

                   <AlertCircle
  size={13}
  className="text-warning"
/>

                  <AlertCircle
  size={13}
  className="text-warning"
/>

                  </>

                )}

              </div>

            )}

          </div>

        </div>

        <ChevronRight
  size={18}
  className="text-muted"
/>

      </div>
    </button>

  );

}
