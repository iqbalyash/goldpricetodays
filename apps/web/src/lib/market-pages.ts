import { formatCurrency, formatSignedPercent, percentChange, TOLA_GRAMS, TROY_OUNCE_GRAMS } from "@goldpricetodays/shared";
import type { Metadata } from "next";
import { decimalToNumber } from "@/lib/catalog";
import {
  loadPricingContext,
  resolveGramPrices,
  type HistoryPoint,
  type ToolCountry,
} from "@/lib/homepage-data";
import { seedMarkets, type SeedCity, type SeedCountry } from "@/lib/markets";
import { getPrisma } from "@/lib/prisma";

const ORIGIN = "https://goldpricetodays.com";

const SHORT_COUNTRY: Record<string, string> = {
  uae: "UAE",
  usa: "USA",
  uk: "UK",
};

export interface PurityRow {
  karat: "24K" | "22K" | "21K" | "18K";
  gram: number;
  eightGram: number;
  tenGram: number;
  tola: number;
  ounce: number;
}

export interface NeighborLink {
  href: string;
  name: string;
  detail: string;
}

export interface MarketPageModel {
  kind: "country" | "city";
  path: string;
  countrySlug: string;
  countryName: string;
  citySlug: string | null;
  cityName: string | null;
  currencyCode: string;
  currencySymbol: string;
  taxPercent: number;
  dutyPercent: number;
  jewelleryTaxPercent: number;
  premiumPercent: number;
  localDescription: string;
  usesTola: boolean;
  marketTimings: string;
  summary: string;
  updatedAt: string | null;
  fromSnapshot: boolean;
  rows: PurityRow[] | null;
  tool: ToolCountry | null;
  neighbors: NeighborLink[];
  breadcrumbs: { name: string; href: string }[];
}

export async function getMarketPage(countrySlug: string, citySlug: string | null): Promise<MarketPageModel | null> {
  const [context, copy] = await Promise.all([loadPricingContext(), readStoredMarketCopy()]);
  const seeded = seedMarkets.find((item) => item.slug === countrySlug);
  if (!seeded) return null;
  const market = applyStoredCopy(seeded, copy);
  const change7d = spotChangeOverDays(context.history, 7);

  if (citySlug === null) {
    return buildCountry(market, context, change7d);
  }

  const city = market.cities.find((item) => item.slug === citySlug);
  if (!city) return null;
  return buildCity(market, city, context, change7d);
}

export async function listPublicUrls(): Promise<{ path: string; lastModified: string | null }[]> {
  const context = await loadPricingContext();
  const homeModified =
    newestSnapshot(context.stored) ?? (context.gold?.updatedAt ? validIso(context.gold.updatedAt) : null);
  const urls: { path: string; lastModified: string | null }[] = [{ path: "/", lastModified: homeModified }];

  for (const market of seedMarkets) {
    const country = await getMarketPage(market.slug, null);
    if (country) urls.push({ path: country.path, lastModified: country.updatedAt });
    for (const city of market.cities) {
      const page = await getMarketPage(market.slug, city.slug);
      if (page) urls.push({ path: page.path, lastModified: page.updatedAt });
    }
  }

  return urls;
}

export function marketTitle(page: MarketPageModel): string {
  const place = page.cityName ?? SHORT_COUNTRY[page.countrySlug] ?? page.countryName;
  if (page.kind === "city") {
    return fitTitle(`Gold Rate in ${place} Today - 24K & 22K Per Tola & Gram`, place);
  }
  const unit = page.usesTola ? "Per Tola" : "Per Gram";
  return fitTitle(`Gold Rate in ${place} Today - 24K & 22K ${unit}`, place);
}

export function marketDescription(page: MarketPageModel): string {
  const place = page.cityName ?? page.countryName;
  const fine = page.rows?.find((row) => row.karat === "24K");
  const standard = page.rows?.find((row) => row.karat === "22K");
  if (!fine || !standard) {
    return clip(
      `${place} gold rates for 24K, 22K, 21K, and 18K per gram, tola, and ounce. Tax ${page.taxPercent}%, duty ${page.dutyPercent}%.`,
    );
  }
  const gram = formatCurrency(fine.gram, page.currencyCode, page.currencySymbol);
  const tola = formatCurrency(standard.tola, page.currencyCode, page.currencySymbol);
  const withHours = `${place}: 24K ${gram}/g, 22K ${tola}/tola. Tax ${page.taxPercent}%, duty ${page.dutyPercent}%. ${page.marketTimings}.`;
  if (withHours.length <= 155) return withHours;
  return clip(
    `${place}: 24K ${gram}/g, 22K ${tola}/tola. Tax ${page.taxPercent}%, duty ${page.dutyPercent}%.`,
  );
}

export function marketMetadata(page: MarketPageModel): Metadata {
  return {
    metadataBase: new URL(ORIGIN),
    title: { absolute: marketTitle(page) },
    description: marketDescription(page),
    alternates: { canonical: page.path },
  };
}

function buildCountry(
  market: SeedCountry,
  context: Awaited<ReturnType<typeof loadPricingContext>>,
  change7d: number | null,
): MarketPageModel | null {
  const quote = resolveGramPrices(market, null, context);
  const rows = quote ? purityRows(quote.grams) : null;
  const hours = market.cities.map((city) => `${city.name} ${city.marketTimings}`).join("; ");
  const delta = deltaSentence(change7d, `${market.name}'s country average`);
  const summary = `${market.name}'s country screen is the average before any city premium. Bullion tax is ${market.defaultTaxPercent}% and duty is ${market.defaultDutyPercent}%. The jewellery calculator starts at ${market.jewelleryTaxPercent}% local tax. Market hours: ${hours}. ${delta}`;

  return {
    kind: "country",
    path: `/gold-price/${market.slug}`,
    countrySlug: market.slug,
    countryName: market.name,
    citySlug: null,
    cityName: null,
    currencyCode: market.currencyCode,
    currencySymbol: market.currencySymbol,
    taxPercent: market.defaultTaxPercent,
    dutyPercent: market.defaultDutyPercent,
    jewelleryTaxPercent: market.jewelleryTaxPercent,
    premiumPercent: 0,
    localDescription: "",
    usesTola: market.usesTola,
    marketTimings: hours,
    summary,
    updatedAt: quote?.updatedAt ? validIso(quote.updatedAt) : null,
    fromSnapshot: quote?.fromSnapshot ?? false,
    rows,
    tool: quote ? toolFrom(market, quote.grams) : null,
    neighbors: market.cities.map((city) => ({
      href: `/gold-price/${market.slug}/${city.slug}`,
      name: city.name,
      detail: `+${city.localPremiumPercent}% local premium · ${city.marketTimings}`,
    })),
    breadcrumbs: [
      { name: "Home", href: "/" },
      { name: market.name, href: `/gold-price/${market.slug}` },
    ],
  };
}

function buildCity(
  market: SeedCountry,
  city: SeedCity,
  context: Awaited<ReturnType<typeof loadPricingContext>>,
  change7d: number | null,
): MarketPageModel {
  const quote = resolveGramPrices(market, city.slug, context);
  const countryQuote = resolveGramPrices(market, null, context);
  const rows = quote ? purityRows(quote.grams) : null;
  const gap =
    quote && countryQuote
      ? ` The 22K tola is ${formatCurrency(quote.grams.k22 * TOLA_GRAMS, market.currencyCode, market.currencySymbol)}, ${formatCurrency(Math.abs(quote.grams.k22 - countryQuote.grams.k22) * TOLA_GRAMS, market.currencyCode, market.currencySymbol)} ${quote.grams.k22 >= countryQuote.grams.k22 ? "above" : "below"} the ${market.name} average.`
      : "";
  const delta = deltaSentence(change7d, city.name);
  const summary = `${city.localDescription} Bullion tax is ${market.defaultTaxPercent}% and duty is ${market.defaultDutyPercent}%. The local premium is ${city.localPremiumPercent}%. Sarafa and bullion hours are ${city.marketTimings}. The jewellery bill below starts on this city's 22K rate with ${market.jewelleryTaxPercent}% local tax.${gap} ${delta}`;

  return {
    kind: "city",
    path: `/gold-price/${market.slug}/${city.slug}`,
    countrySlug: market.slug,
    countryName: market.name,
    citySlug: city.slug,
    cityName: city.name,
    currencyCode: market.currencyCode,
    currencySymbol: market.currencySymbol,
    taxPercent: market.defaultTaxPercent,
    dutyPercent: market.defaultDutyPercent,
    jewelleryTaxPercent: market.jewelleryTaxPercent,
    premiumPercent: city.localPremiumPercent,
    localDescription: city.localDescription,
    usesTola: market.usesTola,
    marketTimings: city.marketTimings,
    summary,
    updatedAt: quote?.updatedAt ? validIso(quote.updatedAt) : null,
    fromSnapshot: quote?.fromSnapshot ?? false,
    rows,
    tool: quote ? toolFrom(market, quote.grams, city.name) : null,
    neighbors: market.cities
      .filter((item) => item.slug !== city.slug)
      .map((item) => ({
        href: `/gold-price/${market.slug}/${item.slug}`,
        name: item.name,
        detail: `+${item.localPremiumPercent}% local premium · ${item.marketTimings}`,
      })),
    breadcrumbs: [
      { name: "Home", href: "/" },
      { name: market.name, href: `/gold-price/${market.slug}` },
      { name: city.name, href: `/gold-price/${market.slug}/${city.slug}` },
    ],
  };
}

function purityRows(grams: { k24: number; k22: number; k21: number; k18: number }): PurityRow[] {
  const spec = [
    ["24K", grams.k24],
    ["22K", grams.k22],
    ["21K", grams.k21],
    ["18K", grams.k18],
  ] as const;
  return spec.map(([karat, perGram]) => ({
    karat,
    gram: perGram,
    eightGram: perGram * 8,
    tenGram: perGram * 10,
    tola: perGram * TOLA_GRAMS,
    ounce: perGram * TROY_OUNCE_GRAMS,
  }));
}

function toolFrom(
  market: SeedCountry,
  grams: { k24: number; k22: number; k21: number; k18: number },
  cityName?: string,
): ToolCountry {
  return {
    slug: market.slug,
    name: cityName ? `${cityName}, ${market.name}` : market.name,
    currencyCode: market.currencyCode,
    currencySymbol: market.currencySymbol,
    jewelleryTaxPercent: market.jewelleryTaxPercent,
    perGram: grams,
  };
}

function deltaSentence(change7d: number | null, place: string): string {
  if (change7d === null) {
    return `A 7-day price delta is not published for ${place} because the daily history feed is not configured.`;
  }
  return `The 7-day international spot move is ${formatSignedPercent(change7d)}, and ${place} moves with that spot while the exchange rate, tax, and duty stay unchanged.`;
}

function spotChangeOverDays(points: HistoryPoint[], days: number): number | null {
  if (points.length < 2) return null;
  const latest = points[points.length - 1];
  if (!latest) return null;
  const latestTime = Date.parse(latest.date);
  if (!Number.isFinite(latestTime)) return null;
  const cutoff = latestTime - (days - 1) * 24 * 60 * 60 * 1000;
  let baseline: HistoryPoint | null = null;
  for (const point of points) {
    const time = Date.parse(point.date);
    if (!Number.isFinite(time) || time > cutoff) continue;
    if (!baseline || time > Date.parse(baseline.date)) baseline = point;
  }
  if (!baseline || baseline.usdPerOunce <= 0) return null;
  return percentChange(baseline.usdPerOunce, latest.usdPerOunce);
}

function newestSnapshot(stored: Record<string, { updatedAt: string }>): string | null {
  let latest: string | null = null;
  for (const quote of Object.values(stored)) {
    const iso = validIso(quote.updatedAt);
    if (iso && (!latest || iso > latest)) latest = iso;
  }
  return latest;
}

function validIso(value: string): string | null {
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

function fitTitle(title: string, place: string): string {
  if (title.length <= 60) return title;
  const shorter = `Gold Rate in ${place} Today - 24K & 22K`;
  return shorter.length <= 60 ? shorter : shorter.slice(0, 60).trim();
}

function clip(value: string): string {
  if (value.length <= 155) return value;
  const trimmed = value.slice(0, 154).replace(/\s+\S*$/, "").trim();
  return trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
}

interface StoredMarketCopy {
  countries: Map<string, { tax: number; duty: number }>;
  cities: Map<string, { premium: number; timings: string; description: string }>;
}

async function readStoredMarketCopy(): Promise<StoredMarketCopy> {
  const empty = { countries: new Map(), cities: new Map() };
  if (!process.env.DATABASE_URL) return empty;
  try {
    const rows = await getPrisma().city.findMany({ include: { country: true } });
    const copy: StoredMarketCopy = { countries: new Map(), cities: new Map() };
    for (const row of rows) {
      copy.countries.set(row.country.slug, {
        tax: decimalToNumber(row.country.defaultTaxPercent),
        duty: decimalToNumber(row.country.defaultDutyPercent),
      });
      copy.cities.set(`${row.country.slug}:${row.slug}`, {
        premium: decimalToNumber(row.localPremiumPercent),
        timings: row.marketTimings,
        description: row.localDescription,
      });
    }
    return copy;
  } catch (error) {
    console.error("City copy read failed", error);
    return empty;
  }
}

function applyStoredCopy(market: SeedCountry, copy: StoredMarketCopy): SeedCountry {
  const country = copy.countries.get(market.slug);
  return {
    ...market,
    defaultTaxPercent: country?.tax ?? market.defaultTaxPercent,
    defaultDutyPercent: country?.duty ?? market.defaultDutyPercent,
    cities: market.cities.map((city) => {
      const stored = copy.cities.get(`${market.slug}:${city.slug}`);
      if (!stored) return city;
      return {
        ...city,
        localPremiumPercent: stored.premium,
        marketTimings: stored.timings,
        localDescription: stored.description,
      };
    }),
  };
}
