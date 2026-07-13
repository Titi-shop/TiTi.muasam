"use client";

import { ArrowLeft, Printer } from "lucide-react";

type Props = {
  orderNumber: string;
  generating?: boolean;

  onBack: () => void;
  onPrint: () => void;
};

export default function Header({
  orderNumber,
  generating = false,
  onBack,
  onPrint,
}: Props) {
  return (
    <header
      className="
        sticky
        top-0
        z-30
        border-b
        bg-[var(--card-bg)]
        border-[var(--border-color)]
        backdrop-blur
      "
    >
      <div className="mx-auto flex items-center justify-between px-4 py-4">

        <button
          type="button"
          onClick={onBack}
          className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            border
            border-[var(--border-color)]
            bg-[var(--surface-1)]
            px-4
            py-2
            text-sm
            font-medium
            text-[var(--text-primary)]
            transition
            hover:bg-[var(--surface-2)]
          "
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="text-center">
          <h1
            className="
              text-lg
              font-bold
              text-[var(--text-primary)]
            "
          >
            #{orderNumber}
          </h1>

          <p
            className="
              text-xs
              text-[var(--text-muted)]
            "
          >
            Delivery Note
          </p>
        </div>

        <button
          type="button"
          onClick={onPrint}
          disabled={generating}
          className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            bg-[var(--color-info)]
            px-4
            py-2
            text-sm
            font-medium
            text-white
            transition
            hover:opacity-90
            disabled:opacity-50
          "
        >
          <Printer size={18} />

          {generating
            ? "Generating..."
            : "Print"}
        </button>

      </div>
    </header>
  );
}
