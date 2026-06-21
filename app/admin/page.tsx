import { redirect } from "next/navigation";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { query } from "@/lib/db";
import AdminWithdrawTable from "./AdminWithdrawTable";

export default async function AdminPage() {
  const auth = await getUserFromBearer();

  if (!auth) {
    redirect("/");
  }

  const userRes = await query(
  `
  SELECT is_admin
  FROM users
  WHERE id = $1
  LIMIT 1
  `,
  [auth.userId]
);

if (!userRes.rows[0]?.is_admin) {
  redirect("/");
}
console.log(
  "[ADMIN]",
  userRes.rows[0]
);
  const withdraws = await query(
    `
    SELECT
      id,
      user_id,
      wallet_address,
      amount,
      status,
      created_at
    FROM withdrawal_requests
    ORDER BY created_at DESC
    LIMIT 100
    `
  );

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        Admin Dashboard
      </h1>

      <AdminWithdrawTable
        rows={withdraws.rows}
      />
    </main>
  );
}
