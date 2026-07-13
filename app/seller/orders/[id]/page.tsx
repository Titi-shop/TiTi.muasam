"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import useSWR from "swr";

import {
  useParams,
  useRouter,
} from "next/navigation";

import QRCode from "qrcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { useAuth } from "@/context/AuthContext";
import { formatPi } from "@/lib/pi";
import AppLoading from "@/components/AppLoading";

import type { Order } from "./types";

import { getOrder } from "./lib/api";

import Header from "./components/Header";
import Timeline from "./components/Timeline";


/* =========================================================
   HELPERS
========================================================= */

function formatDate(
  value: string
) {
  const date =
    new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? "—"
    : date.toLocaleString();
}
/* =========================================================
   PAGE
========================================================= */

export default function SellerOrderDetailPage() {
  const router = useRouter();

  const params = useParams();

  const {
    user,
    loading: authLoading,
  } = useAuth();

  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
      ? params.id[0]
      : "";

  /* =========================================================
     ORDER
  ========================================================= */

  const {
    data: order,
    isLoading,
  } = useSWR<Order | null>(
    !authLoading &&
      user &&
      id
      ? `/api/seller/orders/${id}`
      : null,
    getOrder,
    {
      revalidateOnFocus: false,
    }
  );

  /* =========================================================
     QR CODE
  ========================================================= */

  const [
    qrCode,
    setQrCode,
  ] = useState("");

  useEffect(() => {
    if (!order?.id) return;

    QRCode.toDataURL(
      `order:${order.id}`
    )
      .then(setQrCode)
      .catch(() => {});
  }, [order]);

  /* =========================================================
     TOTAL
  ========================================================= */

  const total =
    useMemo(() => {
      if (!order) return 0;

      if (order.total > 0) {
        return order.total;
      }

      return order.order_items.reduce(
        (sum, item) =>
          sum + item.total_price,
        0
      );
    }, [order]);

  /* =========================================================
     PDF
  ========================================================= */

  const printRef =
    useRef<HTMLDivElement>(null);

  const [
    generating,
    setGenerating,
  ] = useState(false);
    /* =========================================================
     PRINT PDF
  ========================================================= */

  async function handlePrint() {
    try {
      const element = printRef.current;

      if (!element) return;

      setGenerating(true);

      const canvas =
        await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        });

      const image =
        canvas.toDataURL("image/png");

      const pdf = new jsPDF(
        "p",
        "mm",
        "a4"
      );

      const pageWidth = 210;

      const imageHeight =
        (canvas.height *
          pageWidth) /
        canvas.width;

      pdf.addImage(
        image,
        "PNG",
        0,
        10,
        pageWidth,
        imageHeight
      );

      pdf.save(
        `order-${order?.order_number}.pdf`
      );

    } catch {
      alert(
        "Cannot generate PDF."
      );
    } finally {
      setGenerating(false);
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (
    authLoading ||
    isLoading
  ) {
    return <AppLoading />;
  }

  /* =========================================================
     NOT FOUND
  ========================================================= */

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-lg font-medium text-red-500">
          Order not found.
        </p>
      </main>
    );
  }
    /* =========================================================
     UI
  ========================================================= */

  return (
  <main className="min-h-screen bg-[var(--background)] p-4">

    <Header
      orderNumber={order.order_number}
      generating={generating}
      onBack={() => router.back()}
      onPrint={handlePrint}
    />

    <div ref={printRef}>
      <PrintableInvoice
        order={order}
        qr={qrCode}
        total={total}
      />
    </div>

    </main>
  );
}
