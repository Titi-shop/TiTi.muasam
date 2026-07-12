"use client";

import useSWR from "swr";

import { getOrders } from "../lib/api";

export function useOrders(
  enabled: boolean
) {
  const swr = useSWR(
    enabled
      ? "seller-orders"
      : null,
    getOrders,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  return {
    orders: swr.data ?? [],
    loading: swr.isLoading,
    mutate: swr.mutate,
    error: swr.error,
  };
}
