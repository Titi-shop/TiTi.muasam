"use client";

import { countries } from "@/data/countries";

type ShippingRatesState = Record<string, string>;

interface Props {
  shippingRates: ShippingRatesState;
  setShippingRates: (
    v:
      | ShippingRatesState
      | ((prev: ShippingRatesState) => ShippingRatesState)
  ) => void;

  primaryShippingCountry: string;
  setPrimaryShippingCountry: (v: string) => void;
}

export default function ShippingRates({
  shippingRates,
  setShippingRates,
  primaryShippingCountry,
  setPrimaryShippingCountry,
}: Props) {
  const zones = [
    { key: "domestic", label: "Domestic Shipping" },
    { key: "sea", label: "Southeast Asia" },
    { key: "asia", label: "Asia" },
    { key: "europe", label: "Europe" },
    { key: "north_america", label: "North America" },
    { key: "rest_of_world", label: "Rest of World" },
  ];

  const handleChange = (key: string, value: string) => {
    setShippingRates((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-4">
      <p className="font-medium">🚚 Shipping Fee</p>

      {/* COUNTRY */}
      <div className="border rounded-xl p-3 bg-gray-50">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Domestic Country
        </p>

        <select
          value={primaryShippingCountry}
          onChange={(e) => setPrimaryShippingCountry(e.target.value)}
          className="border p-2 rounded w-full"
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* SHIPPING ZONES */}
      <div className="grid grid-cols-2 gap-3">
        {zones.map((z) => (
          <div
            key={z.key}
            className="border rounded-lg p-3 bg-gray-50 space-y-2"
          >
            {/* LABEL HIỂN THỊ RÕ RÀNG */}
            <p className="text-sm font-medium text-gray-700">
              {z.label}
            </p>

            <input
              type="number"
              step="0.00001"
              min="0"
              placeholder="Enter shipping price"
              value={shippingRates[z.key] ?? ""}
              onChange={(e) => handleChange(z.key, e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
