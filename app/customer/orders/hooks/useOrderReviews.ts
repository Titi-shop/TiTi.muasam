"use client";

import { useEffect, useState } from "react";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
export type ReviewedMap =
  Record<string, boolean>;

type ReviewResponse = {
  reviews?: {
    order_id: string;
  }[];
};

export function useOrderReviews() {
  const [
    reviewedMap,
    setReviewedMap,
  ] = useState<ReviewedMap>({});

  useEffect(() => {
    async function loadReviews() {
  try {
    const res = await apiAuthFetch(
      "/api/reviews"
    );

    if (!res.ok) {
      return;
    }

    const data =
      (await res.json()) as ReviewResponse;

    const map: ReviewedMap = {};

    for (const review of data.reviews ?? []) {
      map[review.order_id] = true;
    }

    setReviewedMap(map);

  } catch (error) {
    console.error(error);
  }
}

    void loadReviews();
  }, []);

  function markReviewed(
    orderId: string
  ) {
    setReviewedMap(prev => ({
      ...prev,
      [orderId]: true,
    }));
  }

  return {
    reviewedMap,
    markReviewed,
  };
}
