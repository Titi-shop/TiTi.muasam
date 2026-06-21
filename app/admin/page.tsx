import AdminWithdrawTable from "./AdminWithdrawTable";

export default function AdminPage() {
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
