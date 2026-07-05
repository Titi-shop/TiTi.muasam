import {
  previewOrder,
} from "@/lib/db/orders.preview";

/* =========================================================
   TYPES
========================================================= */

type RawInput = {

  userId: string;

  raw: unknown;

};

type PreviewItem = {

  product_id: string;

  quantity: number;

  variant_id: string | null;

};

type PreviewNormalizedInput = {

  userId: string;

  address_id: string;

  items: PreviewItem[];

};

/* =========================================================
   LOG
========================================================= */

function maskId(
  value: string
): string {

  if (
    value.length <= 8
  ) {

    return value;

  }

  return (
    value.slice(0, 4) +
    "..." +
    value.slice(-4)
  );

}

function vlog(
  step: string,
  data?: unknown
): void {

  console.log(
    `[ORDER][PREVIEW][${step}]`,
    data ?? ""
  );

}

/* =========================================================
   VALIDATION
========================================================= */

function isUUID(
  value: unknown
): value is string {

  return (

    typeof value ===
      "string"

    &&

    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )

  );

}

function normalizeString(
  value: unknown
): string {

  return typeof value ===
    "string"
      ? value.trim()
      : "";

}

function normalizeUUID(
  value: unknown
): string {

  const uuid =
    normalizeString(
      value
    );

  if (
    !isUUID(
      uuid
    )
  ) {

    return "";

  }

  return uuid;

}

function normalizeQuantity(
  value: unknown
): number {

  const number =
    Number(
      value
    );

  if (

    !Number.isInteger(
      number
    )

    ||

    number <= 0

  ) {

    return 1;

  }

  return Math.min(
    number,
    100
  );

}

/* =========================================================
   ERROR
========================================================= */

function ensure(
  condition: boolean,
  code: string
): void {

  if (
    !condition
  ) {

    throw new Error(
      code
    );

  }

}
/* =========================================================
   NORMALIZE REQUEST
========================================================= */

function normalizePreviewInput({
  userId,
  raw,
}: RawInput): PreviewNormalizedInput {

  ensure(
    raw !== null &&
      typeof raw === "object",
    "INVALID_BODY"
  );

  const body =
    raw as Record<
      string,
      unknown
    >;

  if (
    "zone" in body
  ) {

    vlog(
      "CLIENT_ZONE_IGNORED"
    );

  }

  const address_id =
    normalizeUUID(
      body.address_id
    );

  ensure(
    address_id !== "",
    "INVALID_ADDRESS_ID"
  );

  const rawItems =
    Array.isArray(
      body.items
    )
      ? body.items
      : [];

  ensure(
    rawItems.length > 0,
    "INVALID_ITEMS"
  );

  const items:
    PreviewItem[] =
      [];

  for (
    const rawItem of rawItems
  ) {

    if (
      !rawItem ||
      typeof rawItem !==
        "object"
    ) {

      continue;

    }

    const item =
      rawItem as Record<
        string,
        unknown
      >;

    const product_id =
      normalizeUUID(
        item.product_id
      );

    if (
      !product_id
    ) {

      continue;

    }

    const variant_id =
      item.variant_id ===
        null ||
      item.variant_id ===
        undefined
        ? null
        : normalizeUUID(
            item.variant_id
          );

    if (

      item.variant_id &&
      !variant_id

    ) {

      continue;

    }

    items.push({

      product_id,

      variant_id,

      quantity:
        normalizeQuantity(
          item.quantity
        ),

    });

  }

  ensure(
    items.length > 0,
    "INVALID_ITEMS"
  );

  return {

    userId,

    address_id,

    items,

  };

}

/* =========================================================
   MAIN SERVICE
========================================================= */

export async function previewOrderFromRequest(
  input: RawInput
) {

  const normalized =
    normalizePreviewInput(
      input
    );

  vlog(
    "START",
    {

      userId:
        maskId(
          normalized.userId
        ),

      addressId:
        maskId(
          normalized.address_id
        ),

      itemCount:
        normalized.items.length,

    }
  );

  const result =
    await previewOrder(
      normalized
    );

  vlog(
    "SUCCESS",
    {

      subtotal:
        result.subtotal,

      shipping:
        result.shipping_fee,

      total:
        result.total,

    }
  );

  return result;

}
