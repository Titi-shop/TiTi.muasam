import { notFound } from "next/navigation";

import {
  requireAdmin,
} from "@/lib/auth/guard";

import AdminWithdrawTable from "./AdminWithdrawTable";

export default async function AdminPage() {
  const auth =
    await requireAdmin();

  console.log(
    "[ADMIN_PAGE]",
    auth
  );

  if (!auth.ok) {
    return (
      <pre>
        {JSON.stringify(auth, null, 2)}
      </pre>
    );
  }

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">
        Admin Dashboard
      </h1>

      <div className="mt-6">
        <AdminWithdrawTable />
      </div>
    </main>
  );
}
