import {
  getReturnsBySeller as dbGetReturnsBySeller,
  getReturnByIdForSeller as dbGetReturnByIdForSeller,
  approveReturnBySeller as dbApproveReturnBySeller,
  rejectReturnBySeller as dbRejectReturnBySeller,
  markReturnReceivedBySeller as dbMarkReturnReceivedBySeller,
} from "@/lib/db/returns";

import type { ReturnStatus } from "@/lib/db/returns/seller.types";

/* =====================================================
   QUERIES
===================================================== */

export async function listSellerReturns(
  sellerId: string,
  status?: ReturnStatus | null
) {
  return dbGetReturnsBySeller(
    sellerId,
    status ?? null
  );
}

export async function getSellerReturn(
  sellerId: string,
  returnId: string
) {
  return dbGetReturnByIdForSeller(
    returnId,
    sellerId
  );
}

export async function approveSellerReturn(
  sellerId: string,
  returnId: string
) {
  return dbApproveReturnBySeller(
    returnId,
    sellerId
  );
}

export async function rejectSellerReturn(
  sellerId: string,
  returnId: string
) {
  return dbRejectReturnBySeller(
    returnId,
    sellerId
  );
}

export async function receiveSellerReturn(
  sellerId: string,
  returnId: string
) {
  return dbMarkReturnReceivedBySeller(
    returnId,
    sellerId
  );
}
/* =====================================================
   BACKWARD COMPATIBILITY
===================================================== */

export const getReturnsBySeller = listSellerReturns;

export const getReturnDetail = getSellerReturn;

export async function updateReturnStatus(
  sellerId: string,
  returnId: string,
  action: "approve" | "reject" | "received"
) {
  switch (action) {
    case "approve":
      return approveSellerReturn(
        sellerId,
        returnId
      );

    case "reject":
      return rejectSellerReturn(
        sellerId,
        returnId
      );

    case "received":
      return receiveSellerReturn(
        sellerId,
        returnId
      );

    default:
      throw new Error("INVALID_ACTION");
  }
}
