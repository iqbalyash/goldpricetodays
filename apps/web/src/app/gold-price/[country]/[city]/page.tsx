import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RatesFallback } from "@/components/quote-panel";
import { MarketScreen } from "@/components/market/market-screen";
import { getMarketPage, marketMetadata } from "@/lib/market-pages";
import { seedMarkets } from "@/lib/markets";

export function generateStaticParams() {
  return seedMarkets.flatMap((market) =>
    market.cities.map((city) => ({
      country: market.slug,
      city: city.slug,
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string; city: string }>;
}): Promise<Metadata> {
  const { country, city } = await params;
  const page = await getMarketPage(country, city);
  if (!page) return { title: { absolute: "Gold rate" } };
  return marketMetadata(page);
}

export default function CityPage({
  params,
}: {
  params: Promise<{ country: string; city: string }>;
}) {
  return (
    <Suspense fallback={<RatesFallback />}>
      <CityContent params={params} />
    </Suspense>
  );
}

async function CityContent({ params }: { params: Promise<{ country: string; city: string }> }) {
  const { country, city } = await params;
  const page = await getMarketPage(country, city);
  if (!page) notFound();
  return <MarketScreen page={page} />;
}
