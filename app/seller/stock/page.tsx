"use client";

import Image from "next/image";

import {
  Plus,
  Upload,
  Package2,
  ShoppingBag,
  Star,
  Trash2,
  Pencil,
} from "lucide-react";

import {
  useState,
  useEffect,
  useCallback,
} from "react";

import { useRouter } from "next/navigation";

import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

import { useAuth } from "@/context/AuthContext";

import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

import { formatPi } from "@/lib/pi";

import { isNowInRange } from "@/lib/utils/time";

import type {
  SellerProduct,
} from "@/types/Product";

/* =====================================================
   DEFAULTS
===================================================== */

const DEFAULT_AVATAR =
  "/avatars/default-avatar.png";

const DEFAULT_BANNER =
  "/banners/30FD1BCC-E31C-4702-9E63-8BF08C5E311C.png";

/* =====================================================
   TYPES
===================================================== */

interface Message {
  text: string;

  type:
    | "success"
    | "error"
    | "";
}

interface ShopProfile {
  shop_name: string | null;

  shop_banner: string | null;

  avatar_url: string | null;

  shop_description:
    | string
    | null;

  rating: number | null;

  total_reviews:
    | number
    | null;

  total_sales:
    | number
    | null;
}

/* =====================================================
   HELPERS
===================================================== */

function getDisplayPrice(
  p: SellerProduct
) {
  const basePrice =
    typeof p.min_price ===
      "number" &&
    p.min_price > 0
      ? p.min_price
      : p.price;

  const baseSale =
    typeof p.min_sale_price ===
      "number" &&
    p.min_sale_price > 0
      ? p.min_sale_price
      : p.sale_price;

  const isSale =
    isNowInRange(
      p.sale_start,
      p.sale_end
    );

  return {
    price: basePrice,

    sale_price:
      isSale &&
      baseSale
        ? baseSale
        : null,
  };
}

/* =====================================================
   PAGE
===================================================== */

export default function SellerStockPage() {
  const router =
    useRouter();

  const { t } =
    useTranslation();

  const {
    loading:
      authLoading,
  } = useAuth();

  /* =====================================================
     STATES
  ===================================================== */

  const [
    products,
    setProducts,
  ] = useState<
    SellerProduct[]
  >([]);

  const [
    pageLoading,
    setPageLoading,
  ] = useState(true);

  const [
    avatarCache,
    setAvatarCache,
  ] = useState<
    string | null
  >(null);

  const [
    message,
    setMessage,
  ] = useState<Message>({
    text: "",
    type: "",
  });

  const [shop, setShop] =
    useState<ShopProfile>({
      shop_name: null,

      shop_banner: null,

      avatar_url: null,

      shop_description:
        null,

      rating: null,

      total_reviews:
        null,

      total_sales: null,
    });

  /* =====================================================
     AVATAR CACHE
  ===================================================== */

  useEffect(() => {
    const cached =
      localStorage.getItem(
        "avatar"
      );

    if (cached) {
      setAvatarCache(
        cached
      );
    }
  }, []);

  useEffect(() => {
    if (
      shop.avatar_url
    ) {
      setAvatarCache(
        shop.avatar_url
      );

      localStorage.setItem(
        "avatar",
        shop.avatar_url
      );
    }
  }, [shop.avatar_url]);

  /* =====================================================
     COMPUTED
  ===================================================== */

  const avatar =
    avatarCache ||
    shop.avatar_url ||
    DEFAULT_AVATAR;

  const banner =
    shop.shop_banner ||
    DEFAULT_BANNER;

  /* =====================================================
     LOAD PRODUCTS
  ===================================================== */

  const loadProducts =
    useCallback(
      async () => {
        try {
          const res =
            await apiAuthFetch(
              "/api/seller/products",
              {
                cache:
                  "no-store",
              }
            );

          if (!res.ok) {
            setMessage({
              text:
                t.load_products_error,

              type:
                "error",
            });

            return;
          }

          const raw: unknown =
            await res.json();

          const payload =
            raw as {
              profile?: Record<
                string,
                unknown
              >;

              products?: unknown[];
            };

          /* PROFILE */

          const profile =
            payload.profile;

          if (profile) {
            setShop({
              shop_name:
                typeof profile.shop_name ===
                "string"
                  ? profile.shop_name
                  : null,

              shop_banner:
                typeof profile.shop_banner ===
                "string"
                  ? profile.shop_banner
                  : null,

              avatar_url:
                typeof profile.avatar_url ===
                "string"
                  ? profile.avatar_url
                  : null,

              shop_description:
                typeof profile.shop_description ===
                "string"
                  ? profile.shop_description
                  : null,

              rating:
                typeof profile.rating ===
                "number"
                  ? profile.rating
                  : 0,

              total_reviews:
                typeof profile.total_reviews ===
                "number"
                  ? profile.total_reviews
                  : 0,

              total_sales:
                typeof profile.total_sales ===
                "number"
                  ? profile.total_sales
                  : 0,
            });
          }

          /* PRODUCTS */

          const list =
            Array.isArray(
              payload.products
            )
              ? payload.products
              : [];

          const mapped: SellerProduct[] =
            list.map(
              (
                item: unknown
              ) => {
                const p =
                  item as Record<
                    string,
                    unknown
                  >;

                return {
                  id: String(
                    p.id ??
                      ""
                  ),

                  name: String(
                    p.name ??
                      "Unnamed"
                  ),

                  price:
                    Number(
                      p.price ??
                        0
                    ),

                  sale_price:
                    typeof p.sale_price ===
                    "number"
                      ? p.sale_price
                      : null,

                  sale_start:
                    typeof p.sale_start ===
                    "string"
                      ? p.sale_start
                      : null,

                  sale_end:
                    typeof p.sale_end ===
                    "string"
                      ? p.sale_end
                      : null,

                  min_price:
                    typeof p.min_price ===
                    "number"
                      ? p.min_price
                      : undefined,

                  min_sale_price:
                    typeof p.min_sale_price ===
                    "number"
                      ? p.min_sale_price
                      : null,

                  thumbnail:
                    typeof p.thumbnail ===
                    "string"
                      ? p.thumbnail
                      : "",

                  stock:
                    Number(
                      p.stock ??
                        0
                    ),

                  sold:
                    Number(
                      p.sold ??
                        0
                    ),

                  rating_avg:
                    Number(
                      p.rating_avg ??
                        0
                    ),

                  is_active:
                    Boolean(
                      p.is_active
                    ),
                };
              }
            );

          setProducts(
            mapped
          );
        } catch {
          setMessage({
            text:
              t.load_products_error,

            type:
              "error",
          });
        } finally {
          setPageLoading(
            false
          );
        }
      },
      [t]
    );

  /* =====================================================
     EFFECT
  ===================================================== */

  useEffect(() => {
    if (
      !authLoading
    ) {
      loadProducts();
    }
  }, [
    authLoading,
    loadProducts,
  ]);

  /* =====================================================
     BANNER UPLOAD
  ===================================================== */

  const handleBannerUpload =
    async (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        e.target.files?.[0];

      if (!file)
        return;

      try {
        const formData =
          new FormData();

        formData.append(
          "file",
          file
        );

        const res =
          await apiAuthFetch(
            "/api/uploadShopBanner",
            {
              method:
                "POST",

              body:
                formData,
            }
          );

        if (!res.ok) {
          throw new Error();
        }

        const data =
          await res.json();

        setShop(
          (
            prev
          ) => ({
            ...prev,

            shop_banner:
              data.banner,
          })
        );

        setMessage({
          text:
            t.saved_successfully ??
            "Saved successfully",

          type:
            "success",
        });
      } catch {
        setMessage({
          text:
            t.upload_failed ??
            "Upload failed",

          type:
            "error",
        });
      }
    };

  /* =====================================================
     DELETE
  ===================================================== */

  const handleDelete =
    async (
      id: string
    ) => {
      if (
        !confirm(
          t.confirm_delete
        )
      ) {
        return;
      }

      try {
        const res =
          await apiAuthFetch(
            `/api/products?id=${encodeURIComponent(
              id
            )}`,
            {
              method:
                "DELETE",
            }
          );

        if (!res.ok) {
          throw new Error();
        }

        setProducts(
          (
            prev
          ) =>
            prev.filter(
              (
                p
              ) =>
                p.id !==
                id
            )
        );

        setMessage({
          text:
            t.delete_success,

          type:
            "success",
        });
      } catch {
        setMessage({
          text:
            t.delete_failed,

          type:
            "error",
        });
      }
    };

  /* =====================================================
     LOADING
  ===================================================== */

  if (
    pageLoading
  ) {
    return (
      <main
        className="
          min-h-screen
          flex
          items-center
          justify-center
        "
        style={{
          backgroundColor:
            "var(--background)",

          color:
            "var(--muted-foreground)",
        }}
      >
        Loading...
      </main>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <main
      className="
        min-h-screen
        pb-28
      "
      style={{
        backgroundColor:
          "var(--background)",
      }}
    >
      <div
        className="
          mx-auto
          max-w-2xl
          p-4
        "
      >
        {/* SHOP HEADER */}

        <section
          className="
            overflow-hidden
            rounded-3xl
            border
            shadow-sm
            transition-colors
          "
          style={{
            backgroundColor:
              "var(--card-bg)",

            borderColor:
              "var(--border-color)",
          }}
        >
          {/* BANNER */}

          <div
            className="
              relative
              h-44
              w-full
            "
          >
            <Image
              src={banner}
              alt="Banner"
              fill
              priority
              unoptimized
              className="object-cover"
            />

            {/* OVERLAY */}

            <div className="absolute inset-0 bg-black/30" />

            {/* CHANGE BANNER */}

            <label
              className="
                absolute
                left-4
                top-4
                flex
                cursor-pointer
                items-center
                gap-2
                rounded-full
                border
                px-4
                py-2
                text-xs
                font-medium
                text-white
                backdrop-blur-md
                transition-all
              "
              style={{
                borderColor:
                  "rgba(255,255,255,0.25)",

                backgroundColor:
                  "rgba(0,0,0,0.35)",
              }}
            >
              <Upload size={14} />

              {t.change_banner}

              <input
                hidden
                type="file"
                accept="image/*"
                onChange={
                  handleBannerUpload
                }
              />
            </label>

            {/* ADD PRODUCT */}

            <button
              onClick={() =>
                router.push(
                  "/seller/post"
                )
              }
              className="
                absolute
                right-4
                top-4
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-full
                bg-orange-500
                text-white
                shadow-lg
                transition-all
                hover:bg-orange-600
                active:scale-95
              "
            >
              <Plus size={20} />
            </button>
          </div>

          {/* PROFILE */}

          <div
            className="
              relative
              px-5
              pb-6
            "
          >
            {/* AVATAR */}

            <div
              className="
                -mt-12
                flex
                justify-center
              "
            >
              <div
                className="
                  h-24
                  w-24
                  overflow-hidden
                  rounded-full
                  border-4
                  shadow-lg
                "
                style={{
                  borderColor:
                    "var(--card-bg)",

                  backgroundColor:
                    "var(--soft-bg)",
                }}
              >
                <Image
                  src={avatar}
                  alt="Avatar"
                  width={96}
                  height={96}
                  priority
                  unoptimized
                  className="
                    h-full
                    w-full
                    object-cover
                  "
                />
              </div>
            </div>

            {/* NAME */}

            <h1
              className="
                mt-4
                text-center
                text-2xl
                font-bold
              "
              style={{
                color:
                  "var(--foreground)",
              }}
            >
              {shop.shop_name ||
                t.my_store}
            </h1>

            {/* DESCRIPTION */}

            {shop.shop_description && (
              <p
                className="
                  mx-auto
                  mt-2
                  max-w-md
                  text-center
                  text-sm
                  leading-relaxed
                "
                style={{
                  color:
                    "var(--muted-foreground)",
                }}
              >
                {
                  shop.shop_description
                }
              </p>
            )}

            {/* STATS */}

            <div
              className="
                mt-5
                grid
                grid-cols-3
                gap-3
              "
            >
              <div
                className="
                  rounded-2xl
                  border
                  p-3
                  text-center
                "
                style={{
                  backgroundColor:
                    "var(--soft-bg)",

                  borderColor:
                    "var(--border-color)",
                }}
              >
                <div
                  className="
                    mb-1
                    flex
                    justify-center
                  "
                  style={{
                    color:
                      "#f59e0b",
                  }}
                >
                  <Star size={18} />
                </div>

                <p
                  className="
                    text-lg
                    font-bold
                  "
                  style={{
                    color:
                      "var(--foreground)",
                  }}
                >
                  {shop.rating ??
                    0}
                </p>

                <p
                  className="
                    text-xs
                  "
                  style={{
                    color:
                      "var(--muted-foreground)",
                  }}
                >
                  Rating
                </p>
              </div>

              <div
                className="
                  rounded-2xl
                  border
                  p-3
                  text-center
                "
                style={{
                  backgroundColor:
                    "var(--soft-bg)",

                  borderColor:
                    "var(--border-color)",
                }}
              >
                <div
                  className="
                    mb-1
                    flex
                    justify-center
                  "
                  style={{
                    color:
                      "var(--foreground)",
                  }}
                >
                  <Package2
                    size={18}
                  />
                </div>

                <p
                  className="
                    text-lg
                    font-bold
                  "
                  style={{
                    color:
                      "var(--foreground)",
                  }}
                >
                  {
                    products.length
                  }
                </p>

                <p
                  className="
                    text-xs
                  "
                  style={{
                    color:
                      "var(--muted-foreground)",
                  }}
                >
                  Products
                </p>
              </div>

              <div
                className="
                  rounded-2xl
                  border
                  p-3
                  text-center
                "
                style={{
                  backgroundColor:
                    "var(--soft-bg)",

                  borderColor:
                    "var(--border-color)",
                }}
              >
                <div
                  className="
                    mb-1
                    flex
                    justify-center
                  "
                  style={{
                    color:
                      "var(--foreground)",
                  }}
                >
                  <ShoppingBag
                    size={18}
                  />
                </div>

                <p
                  className="
                    text-lg
                    font-bold
                  "
                  style={{
                    color:
                      "var(--foreground)",
                  }}
                >
                  {shop.total_sales ??
                    0}
                </p>

                <p
                  className="
                    text-xs
                  "
                  style={{
                    color:
                      "var(--muted-foreground)",
                  }}
                >
                  Sales
                </p>
              </div>
            </div>

            {/* MESSAGE */}

            {message.text && (
              <div
                className={`
                  mt-5
                  rounded-2xl
                  border
                  px-4
                  py-3
                  text-sm
                  font-medium
                  ${
                    message.type ===
                    "success"
                      ? "border-green-500/30 bg-green-500/10 text-green-500"
                      : "border-red-500/30 bg-red-500/10 text-red-500"
                  }
                `}
              >
                {message.text}
              </div>
            )}
          </div>
        </section>

        {/* EMPTY */}

        {products.length ===
          0 && (
          <div
            className="
              mt-6
              rounded-3xl
              border
              p-10
              text-center
            "
            style={{
              backgroundColor:
                "var(--card-bg)",

              borderColor:
                "var(--border-color)",
            }}
          >
            <p
              style={{
                color:
                  "var(--muted-foreground)",
              }}
            >
              {
                t.no_products
              }
            </p>
          </div>
        )}

        {/* PRODUCTS */}

        <div
          className="
            mt-6
            space-y-4
          "
        >
          {products.map(
            (
              product
            ) => {
              const display =
                getDisplayPrice(
                  product
                );

              const now =
                new Date();

              const start =
                product.sale_start
                  ? new Date(
                      product.sale_start
                    )
                  : null;

              const end =
                product.sale_end
                  ? new Date(
                      product.sale_end
                    )
                  : null;

              const isSale =
                isNowInRange(
                  product.sale_start,
                  product.sale_end
                );

              const upcoming =
                product.sale_price !==
                  null &&
                start &&
                now < start;

              const ended =
                product.sale_price !==
                  null &&
                end &&
                now > end;

              return (
                <div
                  key={
                    product.id
                  }
                  className="
                    overflow-hidden
                    rounded-3xl
                    border
                    shadow-sm
                    transition-all
                  "
                  style={{
                    backgroundColor:
                      "var(--card-bg)",

                    borderColor:
                      "var(--border-color)",
                  }}
                >
                  <div
                    className="
                      flex
                      gap-4
                      p-4
                    "
                  >
                    {/* IMAGE */}

                    <div
                      className="
                        relative
                        h-28
                        w-28
                        overflow-hidden
                        rounded-2xl
                        flex-shrink-0
                      "
                    >
                      {isSale && (
                        <span
                          className="
                            absolute
                            left-2
                            top-2
                            z-10
                            rounded-full
                            bg-red-500
                            px-2
                            py-1
                            text-[10px]
                            font-bold
                            text-white
                          "
                        >
                          SALE
                        </span>
                      )}

                      {upcoming && (
                        <span
                          className="
                            absolute
                            left-2
                            top-2
                            z-10
                            rounded-full
                            bg-blue-500
                            px-2
                            py-1
                            text-[10px]
                            font-bold
                            text-white
                          "
                        >
                          UPCOMING
                        </span>
                      )}

                      {ended && (
                        <span
                          className="
                            absolute
                            left-2
                            top-2
                            z-10
                            rounded-full
                            bg-gray-500
                            px-2
                            py-1
                            text-[10px]
                            font-bold
                            text-white
                          "
                        >
                          ENDED
                        </span>
                      )}

                      {product.thumbnail ? (
                        <Image
                          src={
                            product.thumbnail
                          }
                          alt={
                            product.name
                          }
                          fill
                          sizes="112px"
                          className="object-cover"
                        />
                      ) : (
                        <div
                          className="
                            flex
                            h-full
                            w-full
                            items-center
                            justify-center
                            text-sm
                          "
                          style={{
                            backgroundColor:
                              "var(--soft-bg)",

                            color:
                              "var(--muted-foreground)",
                          }}
                        >
                          {
                            t.no_image
                          }
                        </div>
                      )}
                    </div>

                    {/* CONTENT */}

                    <div className="min-w-0 flex-1">
                      <h3
                        className="
                          line-clamp-2
                          text-sm
                          font-semibold
                        "
                        style={{
                          color:
                            "var(--foreground)",
                        }}
                      >
                        {
                          product.name
                        }
                      </h3>

                      {/* PRICE */}

                      <div className="mt-2">
                        {display.sale_price ? (
                          <div>
                            <p
                              className="
                                text-xs
                                line-through
                              "
                              style={{
                                color:
                                  "var(--muted-foreground)",
                              }}
                            >
                              {formatPi(
                                display.price
                              )}
                            </p>

                            <p
                              className="
                                text-lg
                                font-bold
                                text-red-500
                              "
                            >
                              {formatPi(
                                display.sale_price
                              )}
                            </p>
                          </div>
                        ) : (
                          <p
                            className="
                              text-lg
                              font-bold
                              text-orange-500
                            "
                          >
                            {formatPi(
                              display.price
                            )}
                          </p>
                        )}
                      </div>

                      {/* STATS */}

                      <div
                        className="
                          mt-3
                          flex
                          flex-wrap
                          gap-2
                        "
                      >
                        <span
                          className="
                            rounded-full
                            px-3
                            py-1
                            text-xs
                            font-medium
                          "
                          style={{
                            backgroundColor:
                              "var(--soft-bg)",

                            color:
                              "var(--foreground)",
                          }}
                        >
                          Stock:
                          {" "}
                          {
                            product.stock
                          }
                        </span>

                        <span
                          className="
                            rounded-full
                            px-3
                            py-1
                            text-xs
                            font-medium
                          "
                          style={{
                            backgroundColor:
                              "var(--soft-bg)",

                            color:
                              "var(--foreground)",
                          }}
                        >
                          Sold:
                          {" "}
                          {
                            product.sold
                          }
                        </span>
                      </div>

                      {/* ACTIONS */}

                      <div
                        className="
                          mt-4
                          flex
                          gap-2
                        "
                      >
                        <button
                          onClick={() =>
                            router.push(
                              `/seller/edit/${product.id}`
                            )
                          }
                          className="
                            flex
                            flex-1
                            items-center
                            justify-center
                            gap-2
                            rounded-2xl
                            border
                            px-4
                            py-2.5
                            text-sm
                            font-medium
                            transition-all
                            active:scale-95
                          "
                          style={{
                            backgroundColor:
                              "var(--soft-bg)",

                            borderColor:
                              "var(--border-color)",

                            color:
                              "var(--foreground)",
                          }}
                        >
                          <Pencil
                            size={16}
                          />

                          {t.edit}
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(
                              product.id
                            )
                          }
                          className="
                            flex
                            items-center
                            justify-center
                            rounded-2xl
                            border
                            border-red-500/30
                            bg-red-500/10
                            px-4
                            text-red-500
                            transition-all
                            active:scale-95
                          "
                        >
                          <Trash2
                            size={18}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </main>
  );
}
