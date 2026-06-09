"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPiAccessToken } from "@/lib/piAuth";

import AddressList from "./components/AddressList";
import AddressForm from "./components/AddressForm";

import type { SellerAddress } from "./types";

export default function SellerAddressesPage() {
  const { user, loading } = useAuth();

  const [addresses, setAddresses] = useState<SellerAddress[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [openForm, setOpenForm] = useState(false);

  useEffect(() => {
    if (loading || !user) return;

    const load = async () => {
      try {
        const token = await getPiAccessToken();

        const res = await fetch(
          `/api/seller-addresses?seller_id=${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        setAddresses(data || []);
      } catch (err) {
        console.error("LOAD ADDRESSES ERROR", err);
        setAddresses([]);
      } finally {
        setLoadingData(false);
      }
    };

    load();
  }, [user, loading]);

  return (
    <main className="min-h-screen p-4">
      <div className="mx-auto max-w-2xl">

        {/* HEADER */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">
            Seller Addresses
          </h1>

          <button
            onClick={() => setOpenForm(true)}
            className="rounded-xl bg-orange-500 px-4 py-2 text-white"
          >
            + Add Address
          </button>
        </div>

        {/* LIST */}
        {loadingData ? (
          <p>Loading...</p>
        ) : (
          <AddressList
            addresses={addresses}
            onUpdate={setAddresses}
          />
        )}

        {/* FORM */}
        {openForm && (
          <AddressForm
            onClose={() => setOpenForm(false)}
            onCreated={(addr) =>
              setAddresses((prev) => [addr, ...prev])
            }
          />
        )}
      </div>
    </main>
  );
}
