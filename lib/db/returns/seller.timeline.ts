import type {
  TimelineItem,
} from "./seller.types";

export function buildTimeline(
  ret: {
    created_at: string;
    approved_at?: string | null;
    rejected_at?: string | null;
    shipped_back_at?: string | null;
    received_at?: string | null;
    refunded_at?: string | null;
  }
): TimelineItem[] {

  const timeline: (
    | TimelineItem
    | false
  )[] = [

    {
      key: "created",
      label: "Request created",
      time: ret.created_at,
    },

    ret.approved_at && {
      key: "approved",
      label: "Seller approved",
      time: ret.approved_at,
    },

    ret.rejected_at && {
      key: "rejected",
      label: "Rejected",
      time: ret.rejected_at,
    },

    ret.shipped_back_at && {
      key: "shipping_back",
      label: "Buyer shipped back",
      time: ret.shipped_back_at,
    },

    ret.received_at && {
      key: "received",
      label: "Seller received",
      time: ret.received_at,
    },

    ret.refunded_at && {
      key: "refunded",
      label: "Refund completed",
      time: ret.refunded_at,
    },

  ];

  return timeline.filter(
    (
      item
    ): item is TimelineItem =>
      Boolean(item)
  );
}
