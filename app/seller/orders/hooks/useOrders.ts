"use client";

import useSWR from "swr";

import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

import type {
  Order,
  RawOrder,
} from "../types";

import {
  normalizeOrder,
} from "../lib/helpers";

async function fetchOrders(): Promise<Order[]> {
  const res = await apiAuthFetch(
    "/api/seller/orders",
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return [];
  }

  const data = (await res.json()) as unknown;

  if (!Array.isArray(data)) {
    return [];
  }

  return (data as RawOrder[]).map(
    normalizeOrder
  );
}

export function useOrders(
  enabled: boolean
) {
  const swr = useSWR(
    enabled
      ? "/api/seller/orders"
      : null,
    fetchOrders,
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
