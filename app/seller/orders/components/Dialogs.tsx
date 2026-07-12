"use client";

import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

type BaseProps = {
  open: boolean;
  title: string;
  loading?: boolean;

  children: React.ReactNode;

  confirmText?: string;
  cancelText?: string;

  confirmColor?: string;

  onConfirm: () => void;
  onClose: () => void;
};

/* =========================================================
   BASE
========================================================= */

function DialogBase({
  open,
  title,
  loading = false,
  children,
  confirmText,
  cancelText,
  confirmColor = "bg-orange-500",
  onConfirm,
  onClose,
}: BaseProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">

      <p className="mb-4 text-sm font-semibold">
        {title}
      </p>

      {children}

      <div className="mt-4 grid grid-cols-2 gap-3">

        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border py-2"
        >
          {cancelText ?? t.close ?? "Close"}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={onConfirm}
          className={`rounded-xl py-2 text-white disabled:opacity-50 ${confirmColor}`}
        >
          {loading
            ? "..."
            : confirmText ?? t.ok ?? "OK"}
        </button>

      </div>

    </div>
  );
}

/* =========================================================
   CONFIRM
========================================================= */

type ConfirmProps = {
  open: boolean;
  loading?: boolean;

  message: string;
  onMessageChange: (
    value: string
  ) => void;

  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  loading,
  message,
  onMessageChange,
  onConfirm,
  onClose,
}: ConfirmProps) {
  const { t } = useTranslation();

  return (
    <DialogBase
      open={open}
      loading={loading}
      title={
        t.confirm_order ??
        "Confirm Order"
      }
      confirmText={
        t.confirm ??
        "Confirm"
      }
      onConfirm={onConfirm}
      onClose={onClose}
    >
      <textarea
        rows={3}
        value={message}
        onChange={(e) =>
          onMessageChange(
            e.target.value
          )
        }
        className="w-full rounded-xl border p-3 text-sm"
      />
    </DialogBase>
  );
}

/* =========================================================
   CANCEL
========================================================= */

type CancelProps = {
  open: boolean;

  loading?: boolean;

  reasons: string[];

  selected: string;
  custom: string;

  onSelect: (
    value: string
  ) => void;

  onCustomChange: (
    value: string
  ) => void;

  onConfirm: () => void;
  onClose: () => void;
};

export function CancelDialog({
  open,
  loading,
  reasons,
  selected,
  custom,
  onSelect,
  onCustomChange,
  onConfirm,
  onClose,
}: CancelProps) {
  const { t } = useTranslation();

  return (
    <DialogBase
      open={open}
      loading={loading}
      title={
        t.cancel_order ??
        "Cancel Order"
      }
      confirmColor="bg-red-500"
      onConfirm={onConfirm}
      onClose={onClose}
    >
      <div className="space-y-2">

        {reasons.map((reason) => (
          <button
            key={reason}
            type="button"
            onClick={() =>
              onSelect(reason)
            }
            className={`w-full rounded-xl border px-3 py-2 text-left ${
              selected === reason
                ? "border-red-500 bg-red-50 text-red-600"
                : "border-gray-200"
            }`}
          >
            {reason}
          </button>
        ))}

      </div>

      {selected ===
        (t.cancel_reason_other ??
          "Other") && (
        <input
          value={custom}
          onChange={(e) =>
            onCustomChange(
              e.target.value
            )
          }
          className="mt-3 w-full rounded-xl border p-3"
          placeholder={
            t.enter_reason ??
            "Enter reason"
          }
        />
      )}
    </DialogBase>
  );
}

/* =========================================================
   SHIPPING
========================================================= */

type ShippingProps = {
  open: boolean;
  loading?: boolean;

  onConfirm: () => void;
  onClose: () => void;
};

export function ShippingDialog({
  open,
  loading,
  onConfirm,
  onClose,
}: ShippingProps) {
  const { t } = useTranslation();

  return (
    <DialogBase
      open={open}
      loading={loading}
      title={
        t.start_shipping ??
        "Start shipping?"
      }
      confirmColor="bg-blue-600"
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
