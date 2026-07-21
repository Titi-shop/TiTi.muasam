import type {
  Metadata,
} from "next";

import {
  getProductService,
} from "@/lib/services/products/by-id";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export async function generateMetadata(
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
): Promise<Metadata> {
  const { id } =
    await params;

  const result =
    await getProductService(
      id
    );

  if (
    !result ||
    "error" in result
  ) {
    return {
      title:
        "TiTi Shop",

      description:
        "Sàn thương mại điện tử Pi Network",

      openGraph: {
        title:
          "TiTi Shop",

        description:
          "Sàn thương mại điện tử Pi Network",

        type:
          "website",

        images: [
          {
            url:
              "/logo.png",
          },
        ],
      },

      twitter: {
        card:
          "summary_large_image",

        title:
          "TiTi Shop",

        description:
          "Sàn thương mại điện tử Pi Network",

        images: [
          "/logo.png",
        ],
      },
    };
  }

  const title =
    result.name;

  const description =
    result.short_description?.trim()
      ? result.short_description
      : result.description
          ?.replace(
            /<[^>]*>/g,
            ""
          )
          .slice(
            0,
            160
          ) ??
        "Sàn thương mại điện tử Pi Network";

  const image =
    result.thumbnail ||
    "/logo.png";

  return {
    title,

    description,

    openGraph: {
      title,

      description,

      type:
        "website",

      images: [
        {
          url:
            image,
        },
      ],
    },

    twitter: {
      card:
        "summary_large_image",

      title,

      description,

      images: [
        image,
      ],
    },
  };
}

export default function ProductLayout(
  {
    children,
  }: {
    children: React.ReactNode;
  }
) {
  return children;
}
