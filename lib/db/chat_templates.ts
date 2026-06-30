// =========================================================
// lib/db/chat_templates.ts
// =========================================================

import { query } from "@/lib/db";

/* =========================================================
   TYPES
========================================================= */

export type ChatTemplate = {
  id: string;
  code: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

/* =========================================================
   GET TEMPLATE BY CODE
========================================================= */

export async function getChatTemplateByCode(
  code: string
): Promise<ChatTemplate | null> {
  const result =
    await query<ChatTemplate>(
      `
        SELECT *
        FROM chat_templates
        WHERE
          code = $1
          AND is_active = TRUE
        LIMIT 1
      `,
      [code]
    );

  return result.rows[0] ?? null;
}

/* =========================================================
   GET ALL TEMPLATES
========================================================= */

export async function getChatTemplates(): Promise<
  ChatTemplate[]
> {
  const result =
    await query<ChatTemplate>(
      `
        SELECT *
        FROM chat_templates
        ORDER BY
          created_at ASC
      `
    );

  return result.rows;
}

/* =========================================================
   CREATE TEMPLATE
========================================================= */

export async function createChatTemplate(
  code: string,
  title: string,
  content: string
): Promise<ChatTemplate> {
  const result =
    await query<ChatTemplate>(
      `
        INSERT INTO chat_templates
        (
          code,
          title,
          content
        )
        VALUES
        (
          $1,
          $2,
          $3
        )
        RETURNING *
      `,
      [
        code,
        title,
        content,
      ]
    );

  return result.rows[0];
}

/* =========================================================
   UPDATE TEMPLATE
========================================================= */

export async function updateChatTemplate(
  code: string,
  title: string,
  content: string,
  isActive: boolean
): Promise<ChatTemplate | null> {
  const result =
    await query<ChatTemplate>(
      `
        UPDATE chat_templates
        SET
          title = $2,
          content = $3,
          is_active = $4,
          updated_at = NOW()
        WHERE code = $1
        RETURNING *
      `,
      [
        code,
        title,
        content,
        isActive,
      ]
    );

  return result.rows[0] ?? null;
}

/* =========================================================
   DELETE TEMPLATE
========================================================= */

export async function deleteChatTemplate(
  code: string
): Promise<void> {
  await query(
    `
      DELETE
      FROM chat_templates
      WHERE code = $1
    `,
    [code]
  );
}
