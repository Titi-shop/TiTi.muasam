"use client";

type Row = {
  id: string;
  user_id: string;
  wallet_address: string;
  amount: string;
  status: string;
  created_at: string;
};

export default function AdminWithdrawTable({
  rows,
}: {
  rows: Row[];
}) {
  return (
    <div className="overflow-auto">
      <table className="w-full border">
        <thead>
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>Wallet</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>{row.user_id}</td>
              <td>{row.wallet_address}</td>
              <td>{row.amount} π</td>
              <td>{row.status}</td>
              <td>
                {new Date(
                  row.created_at
                ).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
