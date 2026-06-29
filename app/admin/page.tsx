import { notFound } from "next/navigation";

import {
  requireAdmin,
} from "@/lib/auth/guard";

import AdminWithdrawTable
  from "./AdminWithdrawTable";

export default async function AdminPage() {

  const auth =
    await requireAdmin();

  if (!auth.ok) {
    notFound();
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
