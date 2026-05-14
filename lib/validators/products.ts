import { ProductVariant } from "@/lib/db/variants";

/* =========================================================
   TYPES
========================================================= */

type VariantInput = {
  id?: unknown;

  option1?: unknown;
  option2?: unknown;
  option3?: unknown;

  optionLabel1?: unknown;
  optionLabel2?: unknown;
  optionLabel3?: unknown;

  name?: unknown;

  sku?: unknown;

  price?: unknown;

  salePrice?: unknown;

  saleEnabled?: unknown;

  saleStock?: unknown;

  saleSold?: unknown;

  stock?: unknown;

  isUnlimited?: unknown;

  image?: unknown;

  isActive?: unknown;

  sortOrder?: unknown;

  sold?: unknown;
};

/* =========================================================
   HELPERS
========================================================= */

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function safeString(
  value: unknown,
  fallback = ""
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim();
}

function safeNullableString(
  value: unknown
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length ? trimmed : null;
}

function safeNumber(
  value: unknown,
  fallback = 0
): number {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return parsed;
}

function safeNullableNumber(
  value: unknown
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
}

function safeBoolean(
  value: unknown,
  fallback = false
): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true";
  }

  return fallback;
}

function buildVariantName(
  option1: string,
  option2?: string | null,
  option3?: string | null
): string {
  return [option1, option2, option3]
    .filter(
      (value): value is string =>
        typeof value === "string" &&
        value.trim().length > 0
    )
    .join(" - ");
}

function calcFinalPrice(
  price: number,
  salePrice: number | null,
  saleEnabled: boolean
): number {
  if (
    saleEnabled &&
    salePrice !== null &&
    salePrice > 0 &&
    salePrice < price
  ) {
    return salePrice;
  }

  return price;
}

/* =========================================================
   NORMALIZE SINGLE VARIANT
========================================================= */

export function normalizeVariant(
  raw: unknown,
  index = 0
): ProductVariant | null {
  if (!isObject(raw)) {
    return null;
  }

  const item = raw as VariantInput;

  const option1 = safeString(item.option1);

  if (!option1) {
    console.warn(
      "[VALIDATOR][VARIANT] INVALID_OPTION1",
      {
        index,
      }
    );

    return null;
  }

  const option2 =
    safeNullableString(item.option2);

  const option3 =
    safeNullableString(item.option3);

  const price = safeNumber(item.price);

  const salePrice =
    safeNullableNumber(item.salePrice);

  const saleEnabled = safeBoolean(
    item.saleEnabled
  );

  const stock = safeNumber(item.stock);

  const finalPrice = calcFinalPrice(
    price,
    salePrice,
    saleEnabled
  );

  const variant: ProductVariant = {
    id: safeNullableString(item.id) ?? undefined,

    option1,

    option2,

    option3,

    optionLabel1:
      safeNullableString(
        item.optionLabel1
      ),

    optionLabel2:
      safeNullableString(
        item.optionLabel2
      ),

    optionLabel3:
      safeNullableString(
        item.optionLabel3
      ),

    name:
      safeNullableString(item.name) ??
      buildVariantName(
        option1,
        option2,
        option3
      ),

    sku: safeNullableString(item.sku),

    price,

    salePrice,

    finalPrice,

    saleEnabled,

    saleStock: safeNumber(
      item.saleStock
    ),

    saleSold: safeNumber(
      item.saleSold
    ),

    stock,

    isUnlimited: safeBoolean(
      item.isUnlimited
    ),

    image: safeString(item.image),

    isActive:
      item.isActive !== false,

    sortOrder: safeNumber(
      item.sortOrder,
      index
    ),

    sold: safeNumber(item.sold),
  };

  return variant;
}

/* =========================================================
   NORMALIZE VARIANTS
========================================================= */

export function normalizeVariants(
  input: unknown
): ProductVariant[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const result: ProductVariant[] = [];

  for (
    let index = 0;
    index < input.length;
    index++
  ) {
    const normalized =
      normalizeVariant(
        input[index],
        index
      );

    if (!normalized) {
      continue;
    }

    result.push(normalized);
  }

  return result;
}
}
