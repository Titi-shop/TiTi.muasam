"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useAuth,
} from "@/context/AuthContext";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

type Room = {
  room_id: string;
  user_id: string;
  username: string;
  room_type: string;
  status: string;
  updated_at: string;
};

export default function AdminChatPage() {
  const {
    user,
    loading,
    piReady,
  } = useAuth();

  const router = useRouter();

  /* =====================================================
     AUTH
  ===================================================== */

  useEffect(() => {
    if (
      loading ||
      !piReady
    ) {
      return;
    }

    if (
      !user?.is_admin
    ) {
      router.replace("/404");
    }
  }, [
    loading,
    piReady,
    user,
    router,
  ]);
useEffect(() => {
  if (
    loading ||
    !piReady ||
    !user?.is_admin
  ) {
    return;
  }

  void loadRooms();

}, [
  loading,
  piReady,
  user,
]);
  async function loadRooms() {
  try {

    const res =
      await apiAuthFetch(
        "/api/admin/chat/rooms"
      );

    const data =
      await res.json();

    if (!res.ok) {
      return;
    }

    const nextRooms =
      Array.isArray(
        data.rooms
      )
        ? data.rooms
        : [];

    setRooms(
      nextRooms
    );

    console.log(
  "[ADMIN_CHAT][ROOMS]",
  nextRooms
);

  } catch (err) {
    console.error(
      "[ADMIN_CHAT]",
      err
    );
  }
}
  
  /* =====================================================
     LOADING
  ===================================================== */

  if (
    loading ||
    !piReady
  ) {
    return (
      <main className="p-4 space-y-4">
        {Array.from({
          length: 5,
        }).map((_, index) => (
          <div
            key={index}
            className="
              h-24
              animate-pulse
              rounded-xl
              bg-gray-200
            "
          />
        ))}
      </main>
    );
  }

  /* =====================================================
     WAIT REDIRECT
  ===================================================== */

  if (!user?.is_admin) {
    return null;
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main className="flex h-[100dvh] bg-gray-100">

      {/* Sidebar */}

      <aside className="w-72 border-r bg-white">

        <div className="border-b p-4">
          <h1 className="text-xl font-bold">
            Chat Support
          </h1>
        </div>

        <div className="overflow-y-auto">

          {rooms.map((room) => (
  <button
    key={room.room_id}
    type="button"
    onClick={() => {
  router.push(
    `/admin/chat/${room.room_id}`
  );
}}
    className="
w-full
border-b
px-4
py-4
text-left
transition
hover:bg-gray-50
"
    }`}
  >
              <div className="font-medium">
                {room.username}
              </div>

              <div className="text-sm text-gray-500">
                Người dùng
              </div>
            </button>
          ))}
        </div>
      </aside>
     <main className="min-h-screen bg-gray-100">

  <header className="border-b bg-white p-4">

    <h1 className="text-xl font-bold">
      Chat Support
    </h1>

  </header>

  <section className="bg-white">

    {rooms.map((room) => (

      <button
        key={room.room_id}
        type="button"
        onClick={() => {
          router.push(
            `/admin/chat/${room.room_id}`
          );
        }}
        className="
          flex
          w-full
          items-center
          justify-between
          border-b
          px-4
          py-4
          hover:bg-gray-50
        "
      >

        <div>

          <div className="font-semibold">
            {room.username}
          </div>

          <div className="text-sm text-gray-500">
            Support Chat
          </div>

        </div>

        <div className="text-xs text-gray-400">
          →
        </div>

      </button>

    ))}

  </section>

</main>

    </main>
  );
}
