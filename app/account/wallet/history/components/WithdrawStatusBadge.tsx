// =====================================================
// app/account/wallet/history/components/WithdrawStatusBadge.tsx
// =====================================================

"use client";

import {
  CheckCircle2,
  Clock3,
  Loader2,
  XCircle,
  Ban,
} from "lucide-react";

import type {
  WithdrawStatus,
} from "../history.types";

/* =====================================================
   TYPES
===================================================== */

type Props = {
  status: WithdrawStatus;
};

/* =====================================================
   COMPONENT
===================================================== */

export default function WithdrawStatusBadge({
  status,
}: Props) {

  switch (status) {

    case "pending":

      return (

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

          <Clock3
            size={13}
          />

          Pending

        </span>

      );

    case "processing":

      return (

        <span
          className="
            inline-flex
            items-center
            gap-1.5
            rounded-full
            bg-blue-500/10
            px-2.5
            py-1
            text-xs
            font-medium
            text-blue-600
            dark:text-blue-400
          "
        >

          <Loader2
            size={13}
            className="
              animate-spin
            "
          />

          Processing

        </span>

      );

    case "completed":

      return (

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

          Completed

        </span>

      );

    case "rejected":

      return (

        <span
          className="
            inline-flex
            items-center
            gap-1.5
            rounded-full
            bg-red-500/10
            px-2.5
            py-1
            text-xs
            font-medium
            text-red-600
            dark:text-red-400
          "
        >

          <XCircle
            size={13}
          />

          Rejected

        </span>

      );

    case "cancelled":

      return (

        <span
          className="
            inline-flex
            items-center
            gap-1.5
            rounded-full
            bg-gray-500/10
            px-2.5
            py-1
            text-xs
            font-medium
            text-gray-600
            dark:text-gray-400
          "
        >

          <Ban
            size={13}
          />

          Cancelled

        </span>

      );

    default:

      return null;

  }

}
