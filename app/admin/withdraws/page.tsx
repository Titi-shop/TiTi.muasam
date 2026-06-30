"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

import AdminWithdrawTable from "../AdminWithdrawTable";

export default function AdminWithdrawPage() {
  const {
    user,
    loading,
    piReady,
  } = useAuth();

  const router = useRouter();

  /* =====================================================
     REDIRECT
  ===================================================== */

  useEffect(() => {
    if (loading || !piReady) {
      return;
    }

    if (!user?.is_admin) {
      router.replace("/404");
    }
  }, [
    loading,
    piReady,
    user,
    router,
  ]);

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading || !piReady) {
    return (
      <main className="p-4 space-y-4">
        {Array.from({
          length: 6,
        }).map((_, index) => (
          <div
            key={index}
            className="
              h-24
              animate-pulse
              rounded-xl
              bg-gray-200
            "
          />
        ))}
      </main>
    );
  }

  /* =====================================================
     WAIT REDIRECT
  ===================================================== */

  if (!user?.is_admin) {
    return null;
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main className="min-h-screen bg-gray-100">

      {/* Header */}
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <h1 className="text-2xl font-bold">
          Withdraw Management
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Approve, pay and manage withdrawal requests.
        </p>
      </header>

      {/* Content */}
      <section className="p-6">
        <AdminWithdrawTable />
      </section>

    </main>
  );
}
