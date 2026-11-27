import {
  TOLA_GRAMS,
  TROY_OUNCE_GRAMS,
  calculateLocalGoldPrices,
  percentChange,
} from "@goldpricetodays/shared";
import { decimalToNumber } from "@/lib/catalog";
import { seedMarkets, type SeedCountry } from "@/lib/markets";
import { getPrisma } from "@/lib/prisma";

export const DATASET_DESCRIPTION =
  "Gold Price Today publishes server-rendered 24K, 22K, 21K, and 18K bullion rates in USD and in local currency for Pakistan, India, the United Arab Emirates, Saudi Arabia, the United States, and the United Kingdom, including major city premiums.";

export const FAQ_ITEMS = [
  {
    question: "How often does this page refresh?",
    answer:
      "This homepage is server-rendered and revalidates every 15 minutes. The ticker uses the live XAU/USD and XAG/USD feeds. Country and city quotes refresh when the price update job writes a new database snapshot.",
  },
  {
    question: "How are 22K, 21K, and 18K prices calculated?",
    answer:
      "24K is fine gold. 22K is 22/24 of the fine-gold price, 21K is 21/24, and 18K is 18/24. One troy ounce is 31.1034768 grams. One tola is 11.6638 grams. Ten grams is ten times the per-gram price.",
  },
  {
    question: "What do country and city prices include?",
    answer:
      "A country price converts the USD spot at the live exchange rate, then applies that country's duty and tax. A city price applies the city's local premium after duty and tax. The worldwide cards on this page are the unadjusted USD spot by karat.",
  },
  {
    question: "How does the jewellery bill calculator work?",
    answer:
      "It multiplies the selected karat's per-gram rate by the weight, adds making charges as a percent of that gold value or as a flat amount per gram, then adds GST or VAT on the gold plus making. The tax field starts from the selected country's jewellery tax default and can be edited.",
  },
  {
    question: "How is old-gold exchange value estimated?",
    answer:
      "The estimator multiplies gross weight by the selected karat's per-gram rate, then reduces the result by the melting or purity deduction. The deduction starts at 3 percent and is meant to sit in the usual 2 to 5 percent range.",
  },
  {
    question: "How is Zakat on gold calculated?",
    answer:
      "Nisab on this page is 87.48 grams, about 7.5 tola. If the entered weight is below that, Zakat is zero. If it is at or above nisab, Zakat is 2.5 percent of weight times today's 24K per-gram rate.",
  },
  {
    question: "Where do the 30-day prices come from?",
    answer:
      "The chart plots daily average XAU/USD troy-ounce prices from the gold history feed when a server API key is configured. It does not invent missing days.",
  },
] as const;

export interface UnitPrices {
  gram: number;
  tenGram: number;
  tola: number;
  ounce: number;
}

export interface KaratBoard {
  k24: UnitPrices;
  k22: UnitPrices;
  k21: UnitPrices;
  k18: UnitPrices;
}

export interface MarketLink {
  slug: string;
  name: string;
  cities: { slug: string; name: string }[];
}

export interface ComparisonRow {
  key: string;
  href: string;
  label: string;
  place: "country" | "city";
  currencyCode: string;
  local24kGram: number | null;
  local22kGram: number | null;
  usd24kGram: number | null;
  usd22kGram: number | null;
}

export interface ToolCountry {
  slug: string;
  name: string;
  currencyCode: string;
  currencySymbol: string;
  jewelleryTaxPercent: number;
  perGram: { k24: number; k22: number; k21: number; k18: number };
}

export interface HistoryPoint {
  date: string;
  usdPerOunce: number;
}

export interface HomepageData {
  goldUsdPerOunce: number | null;
  silverUsdPerOunce: number | null;
  spotUpdatedAt: string | null;
  snapshotUpdatedAt: string | null;
  worldwide: KaratBoard | null;
  change24hPercent: number | null;
  rows: ComparisonRow[];
  tools: ToolCountry[];
  markets: MarketLink[];
  history: HistoryPoint[];
  historyNote: string | null;
  feedNote: string | null;
}

interface StoredQuote {
  k24: number;
  k22: number;
  k21: number;
  k18: number;
  change24hPercent: number;
  updatedAt: string;
}

export interface PricingContext {
  gold: { price: number; updatedAt: string } | null;
  silver: { price: number; updatedAt: string } | null;
  fx: Record<string, number> | null;
  stored: Record<string, StoredQuote>;
  history: HistoryPoint[];
  historyNote: string | null;
}

export async function loadPricingContext(): Promise<PricingContext> {
  const [gold, silver, fx, stored, history] = await Promise.all([
    fetchSpot("XAU"),
    fetchSpot("XAG"),
    fetchUsdRates(),
    loadStoredQuotes(),
    fetchHistory(),
  ]);

  return { gold, silver, fx, stored, history: history.points, historyNote: history.note };
}

export async function loadHomepageData(): Promise<HomepageData> {
  const context = await loadPricingContext();
  const { gold, silver, fx } = context;
  const stored = new Map(Object.entries(context.stored));
  const history = { points: context.history, note: context.historyNote };

  const worldwide = gold
    ? boardFromGrams(
        calculateLocalGoldPrices({
          spotUsdPerOunce: gold.price,
          usdToLocalRate: 1,
          taxPercent: 0,
          dutyPercent: 0,
          localPremiumPercent: 0,
        }),
      )
    : null;

  const rows: ComparisonRow[] = [];
  const tools: ToolCountry[] = [];

  for (const market of seedMarkets) {
    const countryQuote = quoteFor(market, null, gold?.price ?? null, fx, stored);
    rows.push({
      key: market.slug,
      href: `/gold-price/${market.slug}`,
      label: market.name,
      place: "country",
      currencyCode: market.currencyCode,
      local24kGram: countryQuote?.k24 ?? null,
      local22kGram: countryQuote?.k22 ?? null,
      usd24kGram: toUsd(countryQuote?.k24 ?? null, market.currencyCode, fx),
      usd22kGram: toUsd(countryQuote?.k22 ?? null, market.currencyCode, fx),
    });

    if (countryQuote) {
      tools.push({
        slug: market.slug,
        name: market.name,
        currencyCode: market.currencyCode,
        currencySymbol: market.currencySymbol,
        jewelleryTaxPercent: market.jewelleryTaxPercent,
        perGram: {
          k24: countryQuote.k24,
          k22: countryQuote.k22,
          k21: countryQuote.k21,
          k18: countryQuote.k18,
        },
      });
    }

    for (const city of market.cities) {
      const cityQuote = quoteFor(market, city.slug, gold?.price ?? null, fx, stored);
      rows.push({
        key: `${market.slug}/${city.slug}`,
        href: `/gold-price/${market.slug}/${city.slug}`,
        label: `${city.name}, ${market.name}`,
        place: "city",
        currencyCode: market.currencyCode,
        local24kGram: cityQuote?.k24 ?? null,
        local22kGram: cityQuote?.k22 ?? null,
        usd24kGram: toUsd(cityQuote?.k24 ?? null, market.currencyCode, fx),
        usd22kGram: toUsd(cityQuote?.k22 ?? null, market.currencyCode, fx),
      });
    }
  }

  const snapshotUpdatedAt = latestSnapshot(stored);
  const change24hPercent =
    changeFromHistory(history.points) ??
    stored.get("usa:_")?.change24hPercent ??
    stored.get("pakistan:_")?.change24hPercent ??
    null;

  const feedNote = gold
    ? null
    : "The live gold spot feed did not respond, so worldwide cards are hidden until the next refresh.";

  return {
    goldUsdPerOunce: gold?.price ?? null,
    silverUsdPerOunce: silver?.price ?? null,
    spotUpdatedAt: gold?.updatedAt || silver?.updatedAt || null,
    snapshotUpdatedAt,
    worldwide,
    change24hPercent,
    rows,
    tools,
    markets: seedMarkets.map((market) => ({
      slug: market.slug,
      name: market.name,
      cities: market.cities.map((city) => ({ slug: city.slug, name: city.name })),
    })),
    history: history.points,
    historyNote: history.note,
    feedNote,
  };
}

function boardFromGrams(quote: {
  price24kGram: number;
  price22kGram: number;
  price21kGram: number;
  price18kGram: number;
}): KaratBoard {
  return {
    k24: units(quote.price24kGram),
    k22: units(quote.price22kGram),
    k21: units(quote.price21kGram),
    k18: units(quote.price18kGram),
  };
}

function units(perGram: number): UnitPrices {
  return {
    gram: perGram,
    tenGram: perGram * 10,
    tola: perGram * TOLA_GRAMS,
    ounce: perGram * TROY_OUNCE_GRAMS,
  };
}

function quoteFor(
  market: SeedCountry,
  citySlug: string | null,
  spot: number | null,
  fx: Record<string, number> | null,
  stored: Map<string, StoredQuote>,
): { k24: number; k22: number; k21: number; k18: number } | null {
  const saved = stored.get(`${market.slug}:${citySlug ?? "_"}`);
  if (saved) {
    return { k24: saved.k24, k22: saved.k22, k21: saved.k21, k18: saved.k18 };
  }
  if (spot === null || fx === null) return null;
  const fxRate = market.currencyCode === "USD" ? (fx.USD ?? 1) : fx[market.currencyCode];
  if (typeof fxRate !== "number" || fxRate <= 0) return null;
  const city = market.cities.find((item) => item.slug === citySlug);
  const live = calculateLocalGoldPrices({
    spotUsdPerOunce: spot,
    usdToLocalRate: fxRate,
    taxPercent: market.defaultTaxPercent,
    dutyPercent: market.defaultDutyPercent,
    localPremiumPercent: city?.localPremiumPercent ?? 0,
  });
  return {
    k24: live.price24kGram,
    k22: live.price22kGram,
    k21: live.price21kGram,
    k18: live.price18kGram,
  };
}

export function resolveGramPrices(
  market: SeedCountry,
  citySlug: string | null,
  context: PricingContext,
): {
  grams: { k24: number; k22: number; k21: number; k18: number };
  updatedAt: string | null;
  fromSnapshot: boolean;
} | null {
  const grams = quoteFor(
    market,
    citySlug,
    context.gold?.price ?? null,
    context.fx,
    new Map(Object.entries(context.stored)),
  );
  if (!grams) return null;
  const saved = context.stored[`${market.slug}:${citySlug ?? "_"}`];
  return {
    grams,
    updatedAt: saved?.updatedAt || context.gold?.updatedAt || null,
    fromSnapshot: Boolean(saved),
  };
}

function toUsd(
  local: number | null,
  currencyCode: string,
  fx: Record<string, number> | null,
): number | null {
  if (local === null) return null;
  if (currencyCode === "USD") return local;
  const rate = fx?.[currencyCode];
  if (typeof rate !== "number" || rate <= 0) return null;
  return local / rate;
}

function latestSnapshot(stored: Map<string, StoredQuote>): string | null {
  let latest: string | null = null;
  for (const quote of stored.values()) {
    if (!latest || quote.updatedAt > latest) latest = quote.updatedAt;
  }
  return latest;
}

function changeFromHistory(points: HistoryPoint[]): number | null {
  if (points.length < 2) return null;
  const previous = points[points.length - 2]?.usdPerOunce;
  const next = points[points.length - 1]?.usdPerOunce;
  if (previous === undefined || next === undefined) return null;
  return percentChange(previous, next);
}

async function loadStoredQuotes(): Promise<Record<string, StoredQuote>> {
  const stored: Record<string, StoredQuote> = {};
  if (!process.env.DATABASE_URL) return stored;
  try {
    const rows = await getPrisma().goldPriceSnapshot.findMany({
      include: { country: true, city: true },
    });
    for (const row of rows) {
      stored[`${row.country.slug}:${row.city?.slug ?? "_"}`] = {
        k24: decimalToNumber(row.price24kGram),
        k22: decimalToNumber(row.price22kGram),
        k21: decimalToNumber(row.price21kGram),
        k18: decimalToNumber(row.price18kGram),
        change24hPercent: decimalToNumber(row.change24hPercent),
        updatedAt: row.updatedAt.toISOString(),
      };
    }
  } catch (error) {
    console.error("Homepage snapshot read failed", error);
  }
  return stored;
}

async function fetchSpot(symbol: "XAU" | "XAG"): Promise<{ price: number; updatedAt: string } | null> {
  try {
    const response = await fetch(`https://api.gold-api.com/price/${symbol}`, {
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    if (!isRecord(body) || body.symbol !== symbol) return null;
    const price = typeof body.price === "number" ? body.price : Number(body.price);
    if (!Number.isFinite(price) || price <= 0) return null;
    return { price, updatedAt: typeof body.updatedAt === "string" ? body.updatedAt : "" };
  } catch (error) {
    console.error(`${symbol} spot fetch failed`, error);
    return null;
  }
}

async function fetchUsdRates(): Promise<Record<string, number> | null> {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    if (!isRecord(body) || body.result !== "success" || !isRecord(body.rates)) return null;
    const rates: Record<string, number> = {};
    for (const [code, value] of Object.entries(body.rates)) {
      if (typeof value === "number" && Number.isFinite(value) && value > 0) rates[code] = value;
    }
    return rates;
  } catch (error) {
    console.error("FX fetch failed", error);
    return null;
  }
}

async function fetchHistory(): Promise<{ points: HistoryPoint[]; note: string | null }> {
  const key = process.env.GOLD_API_KEY;
  if (!key) {
    return {
      points: [],
      note: "30-day history appears when GOLD_API_KEY is set on the server. Missing days are not estimated.",
    };
  }

  const end = Math.floor(Date.now() / 1000);
  const start = end - 30 * 24 * 60 * 60;
  const url = new URL("https://api.gold-api.com/history");
  url.searchParams.set("symbol", "XAU");
  url.searchParams.set("startTimestamp", String(start));
  url.searchParams.set("endTimestamp", String(end));
  url.searchParams.set("groupBy", "day");
  url.searchParams.set("aggregation", "avg");
  url.searchParams.set("orderBy", "asc");

  try {
    const response = await fetch(url, {
      headers: { "x-api-key": key },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      return { points: [], note: "The history feed did not return a 30-day series." };
    }
    const body: unknown = await response.json();
    if (!Array.isArray(body)) return { points: [], note: "The history feed returned an unexpected payload." };
    const points = body.flatMap((entry) => {
      if (!isRecord(entry) || typeof entry.day !== "string") return [];
      const price = numberField(entry, "avg_price") ?? numberField(entry, "max_price");
      if (price === null) return [];
      return [{ date: entry.day, usdPerOunce: price }];
    });
    return {
      points,
      note: points.length > 0 ? null : "The history feed returned no daily gold prices.",
    };
  } catch (error) {
    console.error("Gold history fetch failed", error);
    return { points: [], note: "The history feed could not be reached." };
  }
}

function numberField(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  const price = typeof value === "number" ? value : Number(value);
  return Number.isFinite(price) && price > 0 ? price : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
