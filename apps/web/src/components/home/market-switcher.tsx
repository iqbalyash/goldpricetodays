"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MarketLink } from "@/lib/homepage-data";

export function MarketSwitcher({ markets }: { markets: MarketLink[] }) {
  const router = useRouter();
  const [country, setCountry] = useState(markets[0]?.slug ?? "");
  const cities = markets.find((market) => market.slug === country)?.cities ?? [];

  return (
    <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#F8FAFC]">Country</span>
        <select
          name="country"
          value={country}
          className="field"
          onChange={(event) => {
            const slug = event.target.value;
            setCountry(slug);
            router.push(`/gold-price/${slug}`);
          }}
        >
          {markets.map((market) => (
            <option key={market.slug} value={market.slug}>
              {market.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#F8FAFC]">City</span>
        <select
          name="city"
          defaultValue=""
          className="field"
          onChange={(event) => {
            const slug = event.target.value;
            if (!slug) return;
            router.push(`/gold-price/${country}/${slug}`);
          }}
        >
          <option value="">Country average</option>
          {cities.map((city) => (
            <option key={city.slug} value={city.slug}>
              {city.name}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs leading-5 text-[#94A3B8] sm:pb-2">
        Choosing a market opens its page. Prices stay in the HTML of that URL.
      </p>
    </form>
  );
}
