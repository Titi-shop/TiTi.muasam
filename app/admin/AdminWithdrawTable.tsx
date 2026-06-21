"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

type Row = {
  id: string;
  user_id: string;
  amount: string;
  currency: string;
  withdraw_wallet: string;
  status: string;
  requested_at: string;
};

export default function AdminWithdrawTable() {
  const { t } = useTranslation();

  const {
    user,
    loading: authLoading,
    piReady,
  } = useAuth();

  const [rows, setRows] =
    useState<Row[]>([]);

  const [
    tableLoading,
    setTableLoading,
  ] = useState(true);

  useEffect(() => {
    if (
      authLoading ||
      !piReady ||
      !user
    ) {
      return;
    }

    void loadWithdraws();
  }, [
    authLoading,
    piReady,
    user,
  ]);

  async function loadWithdraws() {
    try {
      const res =
        await apiAuthFetch(
          "/api/admin/withdraws"
        );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ??
            "LOAD_FAILED"
        );
      }

      setRows(
        Array.isArray(data?.rows)
          ? data.rows
          : []
      );
    } catch (err) {
      console.error(
        "[ADMIN_WITHDRAWS]",
        err
      );
    } finally {
      setTableLoading(false);
    }
  }

  if (
    authLoading ||
    tableLoading
  ) {
    return (
      <div className="p-4">
        {t.loading ??
          "Loading..."}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="p-6 text-center">
        No withdraw requests
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div
          key={row.id}
          className="
            rounded-xl
            border
            p-4
            shadow-sm
          "
        >
          <div className="flex justify-between">
            <div>
              <div className="font-semibold">
                {row.amount} π
              </div>

              <div className="text-xs opacity-70">
                {row.status}
              </div>
            </div>

            <div className="text-xs opacity-70">
              {new Date(
                row.requested_at
              ).toLocaleString()}
            </div>
          </div>

          <div className="mt-3">
            <div className="text-xs opacity-70">
              User ID
            </div>

            <div className="break-all text-sm">
              {row.user_id}
            </div>
          </div>

          <div className="mt-3">
            <div className="text-xs opacity-70">
              Withdraw Wallet
            </div>

            <div className="break-all text-sm">
              {row.withdraw_wallet}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              className="
                rounded-lg
                border
                px-3
                py-2
                text-sm
              "
            >
              Details
            </button>

            <button
              className="
                rounded-lg
                border
                px-3
                py-2
                text-sm
              "
            >
              Approve
            </button>

            <button
              className="
                rounded-lg
                border
                px-3
                py-2
                text-sm
              "
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
