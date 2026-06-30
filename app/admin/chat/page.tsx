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
  last_message: string | null;
  last_message_at: string | null;
  unread_count_admin: number;
};

export default function AdminChatPage() {
  const {
    user,
    loading,
    piReady,
  } = useAuth();

  const router = useRouter();
const [
  rooms,
  setRooms,
] = useState<Room[]>([]);
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
  <main className="min-h-screen bg-gray-100">

    <header className="border-b bg-white p-4">
      <h1 className="text-xl font-bold">
        Chat Support
      </h1>
    </header>

    <section className="bg-white">

  {rooms.length === 0 && (

    <div className="p-8 text-center text-gray-400">

      Chưa có cuộc trò chuyện.

    </div>

  )}

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
        transition
        hover:bg-gray-50
      "
    >

      <div className="min-w-0 flex-1">

        <div className="font-semibold">

          {room.username}

        </div>

        <div
          className="
            mt-1
            truncate
            text-sm
            text-gray-500
          "
        >

          {room.last_message ??
            "Chưa có tin nhắn"}

        </div>

      </div>

      <div
        className="
          ml-4
          flex
          flex-col
          items-end
        "
      >

        <div
          className="
            text-xs
            text-gray-400
          "
        >

          {room.last_message_at
            ? new Date(
                room.last_message_at
              ).toLocaleTimeString(
                [],
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )
            : ""}

        </div>

        {room.unread_count_admin >
          0 && (

          <div
            className="
              mt-2
              flex
              h-6
              min-w-6
              items-center
              justify-center
              rounded-full
              bg-red-600
              px-2
              text-xs
              font-semibold
              text-white
            "
          >

            {room.unread_count_admin}

          </div>

        )}

      </div>

    </button>

  ))}

</section>

  </main>
);
}
