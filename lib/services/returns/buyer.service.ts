import {
  getReturnByIdForBuyer,
  cancelReturnByBuyer,
  shipReturnByBuyer,
  listBuyerReturns,
  createBuyerReturn,
} from "@/lib/db/returns";

/* =====================================================
   QUERY
===================================================== */

export async function getReturnDetail(
  buyerId: string,
  returnId: string
) {
  return getReturnByIdForBuyer(
    returnId,
    buyerId
  );
}

/* =====================================================
   COMMAND
===================================================== */

type UpdateReturnBody = {
  action: "cancel" | "ship";
  tracking_code?: string;
  shipping_provider?: string;
};

export async function updateReturnStatus(
  buyerId: string,
  returnId: string,
  body: UpdateReturnBody
) {
  switch (body.action) {

    case "cancel":
      return cancelReturnByBuyer(
        returnId,
        buyerId
      );

    case "ship":

      if (
        !body.tracking_code?.trim()
      ) {
        throw new Error(
          "TRACKING_REQUIRED"
        );
      }

      return shipReturnByBuyer({
        returnId,
        buyerId,
        trackingCode:
          body.tracking_code.trim(),

        shippingProvider:
          body.shipping_provider?.trim() ||
          null,
      });

    default:
      throw new Error(
        "INVALID_ACTION"
      );
  }
}
