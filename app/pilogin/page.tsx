// =====================================================
// app/pilogin/page.tsx
// =====================================================

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ShieldCheck,
  Wallet,
  ShoppingBag,
  Store,
  Loader2,
} from "lucide-react";

import {
  useAuth,
} from "@/context/AuthContext";

import {
  useTranslationClient as useTranslation,
} from "@/app/lib/i18n/client";

/* =====================================================
   PAGE
===================================================== */

export default function PiLoginPage() {

  const router =
    useRouter();

  const { t } =
    useTranslation();

  const {
    user,
    loading,
    piReady,
    pilogin,
  } = useAuth();

  const [
    agreed,
    setAgreed,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* ===================================================
     LOGIN SUCCESS
  =================================================== */

  useEffect(() => {

    if (
      !loading &&
      user
    ) {
      router.replace("/account");
    }

  }, [
    loading,
    user,
    router,
  ]);

  /* ===================================================
     LOGIN
  =================================================== */

  async function handleLogin() {

    try {

      setSubmitting(true);

      setError("");

      await pilogin();

    } catch {

      setError(
        t.login_failed ??
        "Login failed."
      );

      setSubmitting(false);
    }

  }

  /* ===================================================
     UI
  =================================================== */

  return (

    <main
      className="
        flex
        min-h-screen
        items-center
        justify-center
        px-6
      "
      style={{
        background:
          "var(--background)",
      }}
    >

      <div
        className="
          w-full
          max-w-md
          rounded-3xl
          border
          p-8
          shadow-sm
        "
        style={{
          background:
            "var(--card-bg)",
          borderColor:
            "var(--border-color)",
        }}
      >

        {/* LOGO */}

        <div className="mb-8 text-center">

          <div
            className="
              mx-auto
              flex
              h-20
              w-20
              items-center
              justify-center
              rounded-full
              bg-orange-100
            "
          >

            <ShieldCheck
              size={38}
              className="text-orange-600"
            />

          </div>

          <h1
            className="
              mt-5
              text-3xl
              font-bold
            "
          >
            TITI
          </h1>

          <p
            className="
              mt-2
              text-sm
              opacity-70
            "
          >
            Secure Marketplace powered by Pi
          </p>

        </div>

        {/* FEATURES */}

        <div className="space-y-4">

          <Feature
            icon={<Wallet size={18} />}
            text="Wallet & Payments"
          />

          <Feature
            icon={<ShoppingBag size={18} />}
            text="Orders & Tracking"
          />

          <Feature
            icon={<Store size={18} />}
            text="Seller Center"
          />

          <Feature
            icon={<ShieldCheck size={18} />}
            text="Secure Authentication"
          />

        </div>

        {/* TERMS */}

        <div
          className="
            mt-8
            flex
            items-start
            gap-3
          "
        >

          <input
            type="checkbox"
            checked={agreed}
            onChange={() =>
              setAgreed(
                !agreed
              )
            }
            className="
              mt-1
              h-4
              w-4
            "
          />

          <span
            className="
              text-sm
              opacity-70
            "
          >
            {t.i_agree ??
              "I agree to the Terms of Use and Privacy Policy"}
          </span>

        </div>

        {/* ERROR */}

        {error && (

          <div
            className="
              mt-5
              rounded-xl
              bg-red-100
              p-3
              text-sm
              text-red-600
            "
          >
            {error}
          </div>

        )}

        {/* BUTTON */}

        <button
          type="button"
          onClick={handleLogin}
          disabled={
            !piReady ||
            !agreed ||
            submitting
          }
          className="
            mt-8
            flex
            h-14
            w-full
            items-center
            justify-center
            rounded-2xl
            bg-orange-600
            font-semibold
            text-white
            transition
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >

          {submitting ? (

            <>

              <Loader2
                size={18}
                className="
                  mr-2
                  animate-spin
                "
              />

              Authenticating...

            </>

          ) : (

            t.login ??
            "Continue with Pi"

          )}

        </button>

      </div>

    </main>

  );

}

/* =====================================================
   FEATURE
===================================================== */

function Feature({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {

  return (

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
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          bg-orange-100
          text-orange-600
        "
      >
        {icon}
      </div>

      <span
        className="
          text-sm
          font-medium
        "
      >
        {text}
      </span>

    </div>

  );

}
