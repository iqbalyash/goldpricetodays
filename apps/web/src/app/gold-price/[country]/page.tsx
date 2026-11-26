import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RatesFallback } from "@/components/quote-panel";
import { MarketScreen } from "@/components/market/market-screen";
import { getMarketPage, marketMetadata } from "@/lib/market-pages";
import { seedMarkets } from "@/lib/markets";

export function generateStaticParams() {
  return seedMarkets.map((market) => ({ country: market.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}): Promise<Metadata> {
  const { country } = await params;
  const page = await getMarketPage(country, null);
  if (!page) return { title: { absolute: "Gold rate" } };
  return marketMetadata(page);
}

export default function CountryPage({ params }: { params: Promise<{ country: string }> }) {
  return (
    <Suspense fallback={<RatesFallback />}>
      <CountryContent params={params} />
    </Suspense>
  );
}

async function CountryContent({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const page = await getMarketPage(country, null);
  if (!page) notFound();
  return <MarketScreen page={page} />;
}
