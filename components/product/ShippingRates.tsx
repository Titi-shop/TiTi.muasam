"use client";

import { countries } from "@/data/countries";

type ShippingValue = number | "";

interface ShippingRatesState {
  domestic: ShippingValue;
  sea: ShippingValue;
  asia: ShippingValue;
  europe: ShippingValue;
  north_america: ShippingValue;
  rest_of_world: ShippingValue;
}

interface Props {
  shippingRates: ShippingRatesState;
  setShippingRates: React.Dispatch<
    React.SetStateAction<ShippingRatesState>
  >;

  primaryShippingCountry: string;
  setPrimaryShippingCountry: (value: string) => void;
}

const MIN_PRICE = 0.00001;

export default function ShippingRates({
  shippingRates,
  setShippingRates,
  primaryShippingCountry,
  setPrimaryShippingCountry,
}: Props) {
  const zones: {
    key: keyof ShippingRatesState;
    label: string;
  }[] = [
    {
      key: "sea",
      label: "Southeast Asia",
    },
    {
      key: "asia",
      label: "Asia",
    },
    {
      key: "europe",
      label: "Europe",
    },
    {
      key: "north_america",
      label: "North America",
    },
    {
      key: "rest_of_world",
      label: "Rest of World",
    },
  ];

  const updateRate = (
    key: keyof ShippingRatesState,
    value: string
  ) => {
    if (value === "") {
      setShippingRates((prev) => ({
        ...prev,
        [key]: "",
      }));

      return;
    }

    const parsed = Number(value);

    setShippingRates((prev) => ({
      ...prev,
      [key]: Number.isNaN(parsed)
        ? ""
        : parsed,
    }));
  };

  return (
    <div className="space-y-3">
      <p className="font-medium">
        🚚 Shipping Fee
      </p>

      {/* DOMESTIC */}
      <div className="border rounded-xl p-3 bg-gray-50 space-y-2">
        <p className="text-sm font-medium text-gray-700">
          Domestic Country
        </p>

        <div className="grid grid-cols-2 gap-3">
          {/* COUNTRY */}
          <select
            value={primaryShippingCountry}
            onChange={(e) =>
              setPrimaryShippingCountry(e.target.value)
            }
            className="border p-2 rounded"
          >
            {countries.map((country) => (
              <option
                key={country.code}
                value={country.code}
              >
                {country.name}
              </option>
            ))}
          </select>

          {/* DOMESTIC PRICE */}
          <input
            type="number"
            step="0.00001"
            min={MIN_PRICE}
            inputMode="decimal"
            placeholder="Domestic Price"
            value={shippingRates.domestic}
            onChange={(e) =>
              updateRate("domestic", e.target.value)
            }
            className="border p-2 rounded"
          />
        </div>
      </div>

      {/* ZONES */}
      <div className="grid grid-cols-2 gap-3">
        {zones.map((zone) => (
          <div
            key={zone.key}
            className="space-y-1"
          >
            <p className="text-sm text-gray-600">
              {zone.label}
            </p>

            <input
              type="number"
              step="0.00001"
              min={MIN_PRICE}
              inputMode="decimal"
              placeholder="0.00001"
              value={shippingRates[zone.key]}
              onChange={(e) =>
                updateRate(zone.key, e.target.value)
              }
              className="border p-2 rounded w-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
