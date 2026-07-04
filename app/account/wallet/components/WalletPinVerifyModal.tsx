// =====================================================
// app/account/wallet/components/WalletPinVerifyModal.tsx
// =====================================================

"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  ShieldCheck,
  X,
} from "lucide-react";

import {
  useTranslationClient as useTranslation,
} from "@/app/lib/i18n/client";

import {
  apiAuthFetch,
} from "@/lib/api/apiAuthFetch";

/* =====================================================
   CONSTANTS
===================================================== */

const PIN_LENGTH =
  6;

/* =====================================================
   TYPES
===================================================== */

type Props = {

  open: boolean;

  onClose: () => void;

  onSuccess: () => void;

};

/* =====================================================
   COMPONENT
===================================================== */

export default function WalletPinVerifyModal({

  open,

  onClose,

  onSuccess,

}: Props) {

  const { t } =
    useTranslation();

  /* ===================================================
     STATE
  =================================================== */

  const [
    pin,
    setPin,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* ===================================================
     TITLE
  =================================================== */

  const title =
    useMemo(
      () => (

        t.wallet_verify_pin ??

        "Verify Wallet PIN"

      ),
      [
        t,
      ]
    );

  /* ===================================================
     SUBTITLE
  =================================================== */

  const subtitle =
    useMemo(
      () => (

        t.wallet_verify_pin_hint ??

        "Enter your 6-digit PIN to continue."

      ),
      [
        t,
      ]
    );

  /* ===================================================
     HELPERS
  =================================================== */

  function clearError() {

    setError("");

  }

  function resetState() {

    setPin("");

    setError("");

    setLoading(
      false
    );

  }

  function handleClose() {

    if (
      loading
    ) {

      return;

    }

    resetState();

    onClose();

  }

  /* ===================================================
     HIDE
  =================================================== */

  if (!open) {

    return null;

  }
  /* ===================================================
     VERIFY PIN
  =================================================== */

  async function verifyPin(
    value: string
  ) {

    try {

      setLoading(
        true
      );

      clearError();

      const response =
        await apiAuthFetch(

          "/api/wallet/security/verify",

          {

            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json",

            },

            body:
              JSON.stringify({

                pin:
                  value,

              }),

          }

        );

      const json =
        await response.json();

      if (
        !response.ok
      ) {

        setPin("");

        setError(

          json.error ??

          (
            t.wallet_invalid_pin ??

            "Invalid PIN."
          )

        );

        return;

      }

      resetState();

      onSuccess();

    } catch {

      setPin("");

      setError(

        t.wallet_network_error ??

        "Network error."

      );

    } finally {

      setLoading(
        false
      );

    }

  }

  /* ===================================================
     INPUT NUMBER
  =================================================== */

  async function inputNumber(
    number: string
  ) {

    if (
      loading
    ) {

      return;

    }

    clearError();

    if (
      pin.length >=
      PIN_LENGTH
    ) {

      return;

    }

    const next =
      pin + number;

    setPin(
      next
    );

    if (
      next.length !==
      PIN_LENGTH
    ) {

      return;

    }

    await verifyPin(
      next
    );

  }

  /* ===================================================
     DELETE NUMBER
  =================================================== */

  function deleteNumber() {

    if (
      loading
    ) {

      return;

    }

    clearError();

    setPin(

      pin.slice(
        0,
        -1
      )

    );

  }

  /* ===================================================
     BACKDROP
  =================================================== */

  function handleBackdrop() {

    if (
      loading
    ) {

      return;

    }

    handleClose();

  }
  /* ===================================================
     UI
  =================================================== */

  return (

    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-end
        justify-center
        bg-black/60
        backdrop-blur-sm
      "
    >

      {/* BACKDROP */}

      <button
        type="button"
        onClick={
          handleBackdrop
        }
        disabled={
          loading
        }
        className="
          absolute
          inset-0
        "
      />

      {/* SHEET */}

      <div
        className="
          relative
          z-10
          w-full
          rounded-t-[2rem]
          border-t
          border-[var(--nav-border)]
          bg-[var(--card-bg)]
          p-6
          pb-[calc(env(safe-area-inset-bottom)+24px)]
          shadow-2xl
        "
      >

        {/* HANDLE */}

        <div
          className="
            mx-auto
            mb-6
            h-1.5
            w-14
            rounded-full
            bg-[var(--nav-border)]
          "
        />

        {/* CLOSE */}

        <button
          type="button"
          onClick={
            handleClose
          }
          disabled={
            loading
          }
          className="
            absolute
            right-5
            top-5
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            border
            border-[var(--nav-border)]
            bg-[var(--background)]
            disabled:opacity-60
          "
        >

          <X
            size={18}
          />

        </button>

        {/* ICON */}

        <div
          className="
            mx-auto
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-2xl
            bg-primary/10
            text-primary
          "
        >

          <ShieldCheck
            size={30}
          />

        </div>

        {/* TITLE */}

        <h2
          className="
            mt-5
            text-center
            text-xl
            font-bold
            text-[var(--foreground)]
          "
        >
          {title}
        </h2>

        {/* SUBTITLE */}

        <p
          className="
            mt-2
            text-center
            text-sm
            text-[var(--text-muted)]
          "
        >
          {subtitle}
        </p>

        {/* PIN DOTS */}

        <div
          className="
            mt-10
            flex
            justify-center
            gap-4
          "
        >

          {

            Array.from({

              length:
                PIN_LENGTH,

            }).map(

              (
                _,
                index
              ) => (

                <div
                  key={
                    index
                  }
                  className={`
                    h-4
                    w-4
                    rounded-full
                    border-2
                    transition-all

                    ${
                      index <
                      pin.length

                        ? "border-primary bg-primary"

                        : "border-[var(--nav-border)] bg-transparent"

                    }

                  `}
                />

              )

            )

          }

        </div>

        {/* ERROR */}

        {error && (

          <div
            className="
              mt-8
              rounded-2xl
              border
              border-red-500/20
              bg-red-500/10
              px-4
              py-3
              text-center
              text-sm
              font-medium
              text-red-500
            "
          >
            {error}
          </div>

        )}
        {/* KEYBOARD */}

        <div
          className="
            mt-8
            grid
            grid-cols-3
            gap-3
          "
        >

          {[
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "",
            "0",
            "⌫",
          ].map(
            (
              key
            ) => {

              if (
                key === ""
              ) {

                return (
                  <div
                    key="empty"
                  />
                );

              }

              return (

                <button
                  key={key}
                  type="button"
                  disabled={
                    loading
                  }
                  onClick={() => {

                    if (
                      key ===
                      "⌫"
                    ) {

                      deleteNumber();

                      return;

                    }

                    void inputNumber(
                      key
                    );

                  }}
                  className="
                    flex
                    h-16
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-[var(--nav-border)]
                    bg-[var(--background)]
                    text-xl
                    font-bold
                    text-[var(--foreground)]
                    transition
                    active:scale-95
                    disabled:opacity-60
                  "
                >

                  {key}

                </button>

              );

            }

          )}

        </div>

        {/* LOADING */}

        {loading && (

          <p
            className="
              mt-6
              text-center
              text-sm
              text-[var(--text-muted)]
            "
          >
            {

              t.common_processing ??

              "Verifying..."

            }
          </p>

        )}

        {/* CANCEL */}

        <button
          type="button"
          onClick={
            handleClose
          }
          disabled={
            loading
          }
          className="
            mt-6
            w-full
            rounded-2xl
            border
            border-[var(--nav-border)]
            bg-[var(--background)]
            py-3.5
            text-sm
            font-semibold
            text-[var(--foreground)]
            transition
            active:scale-95
            disabled:opacity-60
          "
        >

          {

            t.common_cancel ??

            "Cancel"

          }

        </button>

      </div>

    </div>

  );

}
        
