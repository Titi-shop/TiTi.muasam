// =========================================================
// lib/db/chat.ts
// =========================================================

import { query } from "@/lib/db";

export type ChatRoom = {
  id: string;
  room_type: "support" | "seller" | "group";
  status: "open" | "closed";
  created_by: string;
  created_at: Date;
  updated_at: Date;
};

export type ChatMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  message_type: "text";
  content: string;
  created_at: Date;
};

/* =========================================================
   GET SUPPORT ROOM BY USER
========================================================= */

export async function getSupportRoomByUserId(
  userId: string
): Promise<ChatRoom | null> {
  const result = await query<ChatRoom>(
    `
      SELECT r.*
      FROM chat_rooms r
      INNER JOIN chat_participants p
        ON p.room_id = r.id
      WHERE
        p.participant_id = $1
        AND r.room_type = 'support'
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] ?? null;
}

/* =========================================================
   CREATE SUPPORT ROOM
========================================================= */

export async function createSupportRoom(
  userId: string,
  adminId: string
): Promise<ChatRoom> {
  const roomResult = await query<ChatRoom>(
    `
      INSERT INTO chat_rooms
      (
        room_type,
        status,
        created_by
      )
      VALUES
      (
        'support',
        'open',
        $1
      )
      RETURNING *
    `,
    [userId]
  );

  const room = roomResult.rows[0];

  await query(
    `
      INSERT INTO chat_participants
      (
        room_id,
        participant_id,
        role
      )
      VALUES
      ($1,$2,'user'),
      ($1,$3,'admin')
    `,
    [
      room.id,
      userId,
      adminId,
    ]
  );

  return room;
}

/* =========================================================
   GET ROOM MESSAGES
========================================================= */

export async function getMessagesByRoomId(
  roomId: string
): Promise<ChatMessage[]> {
  const result = await query<ChatMessage>(
    `
      SELECT *
      FROM chat_messages
      WHERE room_id = $1
      ORDER BY created_at ASC
    `,
    [roomId]
  );

  return result.rows;
}

/* =========================================================
   CREATE MESSAGE
========================================================= */

export async function createMessage(
  roomId: string,
  senderId: string,
  content: string
): Promise<ChatMessage> {
  const result = await query<ChatMessage>(
    `
      INSERT INTO chat_messages
      (
        room_id,
        sender_id,
        message_type,
        content
      )
      VALUES
      (
        $1,
        $2,
        'text',
        $3
      )
      RETURNING *
    `,
    [
      roomId,
      senderId,
      content,
    ]
  );

  await query(
    `
      UPDATE chat_rooms
      SET updated_at = NOW()
      WHERE id = $1
    `,
    [roomId]
  );

  return result.rows[0];
}
