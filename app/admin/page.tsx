"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { Suspense } from "react";
import AdminContent from "./AdminContent";

function Loading() {
  return (
    <main className="p-4 space-y-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-24 animate-pulse rounded-xl bg-gray-200"
        />
      ))}
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminContent />
    </Suspense>
  );
}
