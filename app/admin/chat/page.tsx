"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

export default function AdminChatPage() {
  const {
    user,
    loading,
    piReady,
  } = useAuth();

  const router = useRouter();

  useEffect(() => {
    if (loading || !piReady) {
      return;
    }

    if (!user?.is_admin) {
      router.replace("/404");
    }
  }, [
    loading,
    piReady,
    user,
    router,
  ]);

  if (loading || !piReady) {
    return (
      <main className="p-4">
        <div className="h-24 animate-pulse rounded-xl bg-gray-200" />
      </main>
    );
  }

  if (!user?.is_admin) {
    return null;
  }

  return (
    <main className="flex h-[100dvh] flex-col bg-gray-100">
      <header className="border-b bg-white px-4 py-4">
        <h1 className="text-xl font-bold">
          Chat Support
        </h1>

        <p className="text-sm text-gray-500">
          Quản lý cuộc trò chuyện với người dùng
        </p>
      </header>

      <section className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="text-6xl">
            💬
          </div>

          <h2 className="mt-4 text-lg font-semibold">
            Chưa có cuộc trò chuyện
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Danh sách cuộc trò chuyện sẽ hiển thị tại đây.
          </p>
        </div>
      </section>
    </main>
  );
}
