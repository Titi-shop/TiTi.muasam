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

type Room = {
  id: string;
  username: string;
};

type Message = {
  id: string;
  sender: "user" | "admin";
  content: string;
  time: string;
};

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

  const [
  selectedRoom,
  setSelectedRoom,
] = useState<string | null>(null);

  const [
  messages,
  setMessages,
] =
  useState<Message[]>([]);
const [
  rooms,
  setRooms,
] =
  useState<Room[]>([]);
  
  const [input, setInput] =
    useState("");

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

    if (
      nextRooms.length >
      0
    ) {
      setSelectedRoom(
        nextRooms[0]
          .room_id
      );

      await loadMessages(
        nextRooms[0]
          .room_id
      );
    }

  } catch (err) {
    console.error(
      "[ADMIN_CHAT]",
      err
    );
  }
}
  async function loadMessages(
  roomId: string
) {
  try {

    const res =
      await apiAuthFetch(
        `/api/chat/messages?roomId=${roomId}`
      );

    const data =
      await res.json();

    if (!res.ok) {
      return;
    }

    setMessages(
      Array.isArray(
        data.messages
      )
        ? data.messages
        : []
    );

  } catch (err) {
    console.error(err);
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
      setSelectedRoom(
        room.room_id
      );

      void loadMessages(
        room.room_id
      );
    }}
    className={`w-full border-b px-4 py-4 text-left transition ${
      room.room_id === selectedRoom
        ? "bg-blue-50"
        : "hover:bg-gray-50"
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

      {/* Chat */}

      <section className="flex flex-1 flex-col">

        <header className="border-b bg-white p-4">
          <h2 className="font-semibold">
            Hung
          </h2>
        </header>

        <div className="flex-1 overflow-y-auto p-4">

          {messages.map((message) => {

            const isAdmin =
              message.sender ===
              "admin";

            return (
              <div
                key={message.id}
                className={`mb-4 flex ${
                  isAdmin
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-sm rounded-2xl px-4 py-3 ${
                    isAdmin
                      ? "bg-blue-600 text-white"
                      : "bg-white"
                  }`}
                >
                  <div>
                    {message.content}
                  </div>

                  <div
                    className={`mt-2 text-xs ${
                      isAdmin
                        ? "text-blue-100"
                        : "text-gray-500"
                    }`}
                  >
                    {message.time}
                  </div>
                </div>
              </div>
            );

          })}

        </div>

        <footer className="border-t bg-white p-4">

          <div className="flex gap-3">

            <input
              value={input}
              onChange={(e) =>
                setInput(
                  e.target.value
                )
              }
              placeholder="Nhập tin nhắn..."
              className="flex-1 rounded-full border px-4 py-3"
            />

            <button
              className="rounded-full bg-blue-600 px-6 py-3 text-white"
            >
              Gửi
            </button>

          </div>

        </footer>

      </section>

    </main>
  );
}
