import { query, withTransaction } from "@/lib/db";

/* =====================================================
   TYPES
===================================================== */

type WalletRow = {
  balance: string;
};

type OrderRow = {
  total_amount: string;
  status: string;
};

type JournalDirection =
  | "CREDIT"
  | "DEBIT";

type JournalEntryType =
  | "ESCROW_HOLD"
  | "BUYER_REFUND"
  | "SELLER_CREDIT"
  | "SELLER_ESCROW_RELEASE"
  | "SELLER_WITHDRAW"
  | "SYSTEM_COMPENSATION";

/* =====================================================
   HELPERS
===================================================== */

function isValidUuid(
  value: string
): boolean {
  return /^[0-9a-f-]{36}$/i.test(
    value
  );
}

function toNumberSafe(
  value: unknown,
  field: string
): number {

  const n = Number(value);

  if (Number.isNaN(n)) {

    console.error(
      "❌ [WALLET][PARSE_ERROR]",
      {
        field,
        value,
      }
    );

    throw new Error(
      "INVALID_NUMBER"
    );
  }

  return n;
}

function error(
  message: string
): never {
  throw new Error(message);
}

/* =====================================================
   ENSURE WALLET
===================================================== */

export async function ensureWallet(
  userId: string
): Promise<void> {

  await query(
    `
    INSERT INTO wallets (
      user_id,
      balance
    )
    VALUES ($1, 0)

    ON CONFLICT (user_id)
    DO NOTHING
    `,
    [userId]
  );
}

/* =====================================================
   GET WALLET
===================================================== */

export async function getWalletByUserId(
  userId: string
) {

  if (!isValidUuid(userId)) {
    error("INVALID_USER_ID");
  }

  await ensureWallet(userId);

  const { rows } =
    await query<WalletRow>(
      `
      SELECT balance
      FROM wallets
      WHERE user_id = $1
      LIMIT 1
      `,
      [userId]
    );

  const balance =
    toNumberSafe(
      rows[0]?.balance ?? 0,
      "balance"
    );

  return {
    balance,
  };
}

/* =====================================================
   CREATE JOURNAL ENTRY
===================================================== */

export async function createWalletJournal(
  params: {

    ownerId: string;

    ownerType:
      | "BUYER"
      | "SELLER"
      | "SYSTEM"
      | "ADMIN";

    refId?: string | null;

    refTable?: string | null;

    entryType:
      JournalEntryType;

    direction:
      JournalDirection;

    amount: number;

    note?: string;

    metadata?: Record<
      string,
      unknown
    >;

    eventHash?: string | null;

    createdBy?: string | null;
  }
) {

  if (
    !isValidUuid(params.ownerId)
  ) {
    error("INVALID_OWNER_ID");
  }

  if (
    params.amount <= 0
  ) {
    error("INVALID_AMOUNT");
  }

  await query(
    `
    INSERT INTO wallet_journal (

      owner_id,
      owner_type,

      ref_id,
      ref_table,

      entry_type,
      direction,

      amount,
      currency,

      note,
      metadata,

      event_hash,
      created_by

    )
    VALUES (

      $1,
      $2,

      $3,
      $4,

      $5,
      $6,

      $7,
      'PI',

      $8,
      $9,

      $10,
      $11
    )
    `,
    [
      params.ownerId,
      params.ownerType,

      params.refId ?? null,
      params.refTable ?? null,

      params.entryType,
      params.direction,

      params.amount,

      params.note ?? null,

      JSON.stringify(
        params.metadata ?? {}
      ),

      params.eventHash ?? null,
      params.createdBy ?? null,
    ]
  );
}

/* =====================================================
   CREDIT INTERNAL WALLET
===================================================== */

export async function creditWallet(
  params: {
    userId: string;
    amount: number;
  }
) {

  const {
    userId,
    amount,
  } = params;

  if (
    !isValidUuid(userId)
  ) {
    error("INVALID_USER_ID");
  }

  if (
    amount <= 0
  ) {
    error("INVALID_AMOUNT");
  }

  return withTransaction(
    async (client) => {

      await client.query(
        `
        INSERT INTO wallets (
          user_id,
          balance
        )
        VALUES ($1, 0)

        ON CONFLICT (user_id)
        DO NOTHING
        `,
        [userId]
      );

      await client.query(
        `
        UPDATE wallets

        SET
          balance =
            balance + $1,

          updated_at =
            now()

        WHERE user_id = $2
        `,
        [
          amount,
          userId,
        ]
      );
    }
  );
}

/* =====================================================
   DEBIT INTERNAL WALLET
===================================================== */

export async function debitWallet(
  params: {
    userId: string;
    amount: number;
  }
) {

  const {
    userId,
    amount,
  } = params;

  if (
    !isValidUuid(userId)
  ) {
    error("INVALID_USER_ID");
  }

  if (
    amount <= 0
  ) {
    error("INVALID_AMOUNT");
  }

  return withTransaction(
    async (client) => {

      const { rows } =
        await client.query<WalletRow>(
          `
          SELECT balance
          FROM wallets
          WHERE user_id = $1
          FOR UPDATE
          `,
          [userId]
        );

      if (!rows.length) {
        error("WALLET_NOT_FOUND");
      }

      const balance =
        toNumberSafe(
          rows[0].balance,
          "balance"
        );

      if (
        balance < amount
      ) {
        error(
          "INSUFFICIENT_BALANCE"
        );
      }

      await client.query(
        `
        UPDATE wallets

        SET
          balance =
            balance - $1,

          updated_at =
            now()

        WHERE user_id = $2
        `,
        [
          amount,
          userId,
        ]
      );
    }
  );
}

/* =====================================================
   PAY WITH WALLET
===================================================== */

export async function payWithWallet(
  params: {
    userId: string;
    orderId: string;
  }
) {

  const {
    userId,
    orderId,
  } = params;

  if (
    !isValidUuid(userId) ||
    !isValidUuid(orderId)
  ) {
    error("INVALID_INPUT");
  }

  return withTransaction(
    async (client) => {

      const { rows } =
        await client.query<OrderRow>(
          `
          SELECT
            total_amount,
            status

          FROM orders

          WHERE
            id = $1
            AND buyer_id = $2

          LIMIT 1

          FOR UPDATE
          `,
          [
            orderId,
            userId,
          ]
        );

      const order =
        rows[0];

      if (!order) {
        error(
          "ORDER_NOT_FOUND"
        );
      }

      if (
        order.status !==
        "pending"
      ) {
        error(
          "INVALID_ORDER_STATE"
        );
      }

      const amount =
        toNumberSafe(
          order.total_amount,
          "total_amount"
        );

      /* ===============================
         DEBIT WALLET
      =============================== */

      await debitWallet({
        userId,
        amount,
      });

      /* ===============================
         JOURNAL
      =============================== */

      await client.query(
        `
        INSERT INTO wallet_journal (

          owner_id,
          owner_type,

          ref_id,
          ref_table,

          entry_type,
          direction,

          amount,
          currency,

          note

        )
        VALUES (

          $1,
          'BUYER',

          $2,
          'orders',

          'ESCROW_HOLD',
          'DEBIT',

          $3,
          'PI',

          'Wallet payment for order'
        )
        `,
        [
          userId,
          orderId,
          amount,
        ]
      );

      /* ===============================
         UPDATE ORDER
      =============================== */

      await client.query(
        `
        UPDATE orders

        SET
          status = 'paid',
          updated_at = now()

        WHERE id = $1
        `,
        [orderId]
      );
    }
  );
}
