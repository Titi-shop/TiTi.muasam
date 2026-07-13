"use client";

import Image from "next/image";
import { formatPi } from "@/lib/pi";
import Timeline from "./Timeline";
import type { Order } from "../types";

type Props = {
  order: Order;
  qr: string;
  total: number;
};

function formatDate(date: string) {
  const d = new Date(date);

  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString();
}

export default function PrintableInvoice({
  order,
  qr,
  total,
}: Props) {
  return (
    <section
      className="
        mx-auto
        max-w-xl
        rounded-2xl
        border
        border-[var(--border-color)]
        bg-[var(--card-bg)]
        p-5
        shadow-sm
      "
    >
      <h1 className="mb-4 text-center text-xl font-bold">
        DELIVERY NOTE
      </h1>

      {qr && (
        <div className="mb-4 flex justify-center">
          <Image
            src={qr}
            alt="QR"
            width={140}
            height={140}
            unoptimized
          />
        </div>
      )}
<Timeline order={order} />
      <div className="mb-5 space-y-1 text-sm">

        <p>
          <strong>Receiver:</strong>{" "}
          {order.shipping_name}
        </p>

        <p>
          <strong>Phone:</strong>{" "}
          {order.shipping_phone}
        </p>

        <p>
          <strong>Address:</strong>{" "}
          {[
            order.shipping_address_line,
            order.shipping_ward,
            order.shipping_district,
            order.shipping_region,
          ]
            .filter(Boolean)
            .join(", ")}
        </p>

        <p>
          <strong>Country:</strong>{" "}
          {order.shipping_country}
        </p>

        <p>
          <strong>Postal:</strong>{" "}
          {order.shipping_postal_code}
        </p>

        <p>
          <strong>Created:</strong>{" "}
          {formatDate(order.created_at)}
        </p>

      </div>

      <table className="w-full border text-sm">

        <thead>

          <tr className="bg-gray-100">

            <th className="border px-2 py-2">
              #
            </th>

            <th className="border px-2 py-2">
              Product
            </th>

            <th className="border px-2 py-2">
              Qty
            </th>

            <th className="border px-2 py-2 text-right">
              π
            </th>

          </tr>

        </thead>

        <tbody>

          {order.order_items.map(
            (item, index) => (
              <tr key={item.id}>

                <td className="border px-2 py-2">
                  {index + 1}
                </td>

             <td className="border px-2 py-2">

  <div className="flex items-center gap-3">

    {item.thumbnail && (
      <Image
        src={item.thumbnail}
        alt={item.product_name}
        width={48}
        height={48}
        className="rounded-lg object-cover"
        unoptimized
      />
    )}

    <div>

      <div className="font-medium">
        {item.product_name}
      </div>

      {(item.variant_name || item.variant_value) && (
        <div className="text-xs text-gray-500">
          {item.variant_name}
          {item.variant_name && item.variant_value ? ": " : ""}
          {item.variant_value}
        </div>
      )}

    </div>

  </div>

</td>

                <td className="border px-2 py-2 text-center">
                  {item.quantity}
                </td>

                <td className="border px-2 py-2 text-right">
                  π{formatPi(item.total_price)}
                </td>

              </tr>
            )
          )}

        </tbody>

      </table>

      <div className="mt-5 text-right text-lg font-semibold">
        Total: π{formatPi(total)}
      </div>

    </section>
  );
}
