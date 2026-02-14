"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, Bell, User, Search } from "lucide-react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navItems = [
    { href: "/", label: t.home || "Home", icon: Home },
    { href: "/categories", label: t.categories || "Categories", icon: Grid },
    { href: "/search", label: t.search || "Search", icon: Search },
    { href: "/notifications", label: t.notifications || "Notifications", icon: Bell },
    { href: "/account", label: t.me || "Me", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-14 flex z-50">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center relative"
          >
            <Icon
              className={`w-6 h-6 transition-all ${
                active ? "text-black" : "text-gray-400"
              }`}
            />

            {/* Label chỉ hiển thị khi active */}
            <span
              className={`text-[10px] mt-0.5 transition-opacity duration-150 ${
                active
                  ? "opacity-100 text-black font-medium"
                  : "opacity-0 pointer-events-none absolute"
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
