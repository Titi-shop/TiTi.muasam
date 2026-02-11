import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([
    { id: 1, key: "category_1", icon: "/banners/dienthoai.jpg" },
    { id: 2, key: "category_2", icon: "/banners/thời trang nam.jpg" },
    { id: 3, key: "category_3", icon: "/banners/thời trang nữ.jpg" },
    { id: 4, key: "category_4", icon: "/banners/giày dép.jpg" },
    { id: 5, key: "category_5", icon: "/banners/nước hoa.jpg" },
    { id: 7, key: "category_7", icon: "/banners/mevabe.jpg" },
    { id: 9, key: "category_9", icon: "/banners/giadung.jpg" },
    { id: 10, key: "category_10", icon: "/banners/suckhoe.jpg" },
    { id: 11, key: "category_11", icon: "/banners/thethaosuckhoe.jpg" },
    { id: 12, key: "category_12", icon: "/banners/oto.jpg" },
    { id: 13, key: "category_13", icon: "/banners/thucung.jpg" },
    { id: 14, key: "category_14", icon: "/banners/dienmay.jpg" },
    { id: 15, key: "category_15", icon: "/banners/sach.jpg" },
    { id: 16, key: "category_16", icon: "/banners/đông hồ .jpg" },
    { id: 18, key: "category_18", icon: "/banners/máy ảnh.jpg" },
    { id: 19, key: "category_19", icon: "/banners/dochoitreem.jpg" },
    { id: 20, key: "category_20", icon: "/banners/noithat.jpg" },
  ]);
}
