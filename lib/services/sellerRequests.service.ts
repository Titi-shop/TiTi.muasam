import {
  getPendingSellerRequest,
  createSellerRequest,
} from "@/lib/db/sellerRequests";

import {
  logger,
  maskId,
} from "@/lib/logger";

type Role =
  | "customer"
  | "seller"
  | "admin";

type RegisterSellerResult = {
  status: number;
  body: {
    success?: boolean;
    status?: "pending";
    role?: Role;
    message?: string;
    error?: string;
  };
};

export async function registerSeller(
  userId: string,
  role: Role
): Promise<RegisterSellerResult> {

  logger.info(
    "[SELLER] REGISTER_START",
    {
      userId: maskId(userId),
    }
  );

  if (
    role === "seller" ||
    role === "admin"
  ) {

    logger.info(
      "[SELLER] ALREADY_SELLER",
      {
        userId: maskId(userId),
        role,
      }
    );

    return {
      status: 200,
      body: {
        success: true,
        role,
        message: "ALREADY_SELLER",
      },
    };
  }

  const pending =
    await getPendingSellerRequest(
      userId
    );

  if (pending) {

    logger.info(
      "[SELLER] REQUEST_EXISTS",
      {
        userId: maskId(userId),
        requestId: maskId(
          pending.id
        ),
      }
    );

    return {
      status: 409,
      body: {
        error:
          "REQUEST_ALREADY_PENDING",
      },
    };
  }

  const request =
    await createSellerRequest(
      userId
    );

  logger.info(
    "[SELLER] REGISTER_SUCCESS",
    {
      userId: maskId(userId),
      requestId: maskId(
        request.id
      ),
    }
  );

  return {
    status: 200,
    body: {
      success: true,
      status: "pending",
    },
  };
}
