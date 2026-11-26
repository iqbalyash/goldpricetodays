import {
  calculateLocalGoldPrices,
  percentChange,
  type LocalGoldQuote,
} from "@goldpricetodays/shared";
import { decimalToNumber } from "@/lib/catalog";
import { getPrisma } from "@/lib/prisma";

const GOLD_SPOT_URL = "https://api.gold-api.com/price/XAU";
const FX_URL = "https://open.er-api.com/v6/latest/USD";

export class PriceFeedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PriceFeedError";
  }
}

export interface PriceUpdateSummary {
  spotUsdPerOunce: number;
  spotUpdatedAt: string;
  quotesWritten: number;
  skipped: { country: string; reason: string }[];
  paths: string[];
}

interface SnapshotWrite {
  scopeKey: string;
  countryId: string;
  cityId: string | null;
  quote: LocalGoldQuote;
  change24hPercent: number;
}

export async function updateGoldPrices(): Promise<PriceUpdateSummary> {
  const [spot, rates] = await Promise.all([fetchGoldSpot(), fetchUsdRates()]);
  const prisma = getPrisma();
  const countries = await prisma.country.findMany({
    include: { cities: { orderBy: { slug: "asc" } } },
    orderBy: { slug: "asc" },
  });
  const existing = await prisma.goldPriceSnapshot.findMany({
    select: { scopeKey: true, price24kGram: true },
  });
  const previousByScope = new Map(
    existing.map((row) => [row.scopeKey, decimalToNumber(row.price24kGram)]),
  );

  const skipped: { country: string; reason: string }[] = [];
  const writes: SnapshotWrite[] = [];

  for (const country of countries) {
    const fxRate = usdRate(rates, country.currencyCode);
    if (fxRate === null) {
      skipped.push({
        country: country.slug,
        reason: `No usable USD to ${country.currencyCode} rate.`,
      });
      continue;
    }

    const taxPercent = decimalToNumber(country.defaultTaxPercent);
    const dutyPercent = decimalToNumber(country.defaultDutyPercent);
    writes.push(
      buildWrite({
        countryId: country.id,
        cityId: null,
        spot: spot.price,
        fxRate,
        taxPercent,
        dutyPercent,
        localPremiumPercent: 0,
        previousByScope,
      }),
    );

    for (const city of country.cities) {
      writes.push(
        buildWrite({
          countryId: country.id,
          cityId: city.id,
          spot: spot.price,
          fxRate,
          taxPercent,
          dutyPercent,
          localPremiumPercent: decimalToNumber(city.localPremiumPercent),
          previousByScope,
        }),
      );
    }
  }

  if (writes.length > 0) {
    await prisma.$transaction(
      writes.map((write) => {
        const prices = priceColumns(write);
        return prisma.goldPriceSnapshot.upsert({
          where: { scopeKey: write.scopeKey },
          create: {
            scopeKey: write.scopeKey,
            countryId: write.countryId,
            cityId: write.cityId,
            ...prices,
          },
          update: prices,
        });
      }),
    );
  }

  return {
    spotUsdPerOunce: spot.price,
    spotUpdatedAt: spot.updatedAt,
    quotesWritten: writes.length,
    skipped,
    paths: marketPaths(countries),
  };
}

function marketPaths(countries: { slug: string; cities: { slug: string }[] }[]): string[] {
  return [
    "/",
    ...countries.flatMap((country) => [
      `/gold-price/${country.slug}`,
      ...country.cities.map((city) => `/gold-price/${country.slug}/${city.slug}`),
    ]),
  ];
}

function buildWrite(input: {
  countryId: string;
  cityId: string | null;
  spot: number;
  fxRate: number;
  taxPercent: number;
  dutyPercent: number;
  localPremiumPercent: number;
  previousByScope: Map<string, number>;
}): SnapshotWrite {
  const scopeKey = input.cityId ? `${input.countryId}:${input.cityId}` : `${input.countryId}:country`;
  const quote = calculateLocalGoldPrices({
    spotUsdPerOunce: input.spot,
    usdToLocalRate: input.fxRate,
    taxPercent: input.taxPercent,
    dutyPercent: input.dutyPercent,
    localPremiumPercent: input.localPremiumPercent,
  });
  return {
    scopeKey,
    countryId: input.countryId,
    cityId: input.cityId,
    quote,
    change24hPercent: percentChange(input.previousByScope.get(scopeKey) ?? 0, quote.price24kGram),
  };
}

function priceColumns(write: SnapshotWrite) {
  return {
    price24kGram: write.quote.price24kGram.toFixed(4),
    price22kGram: write.quote.price22kGram.toFixed(4),
    price21kGram: write.quote.price21kGram.toFixed(4),
    price18kGram: write.quote.price18kGram.toFixed(4),
    price24kTola: write.quote.price24kTola.toFixed(4),
    price22kTola: write.quote.price22kTola.toFixed(4),
    price24kOunce: write.quote.price24kOunce.toFixed(4),
    change24hPercent: write.change24hPercent.toFixed(4),
  };
}

function usdRate(rates: Record<string, number>, currencyCode: string): number | null {
  if (currencyCode === "USD") {
    return rates.USD && rates.USD > 0 ? rates.USD : 1;
  }
  const rate = rates[currencyCode];
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) return null;
  return rate;
}

async function fetchGoldSpot(): Promise<{ price: number; updatedAt: string }> {
  const response = await fetch(GOLD_SPOT_URL, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new PriceFeedError(`Gold spot request failed (${response.status}).`);
  }

  const body: unknown = await response.json();
  if (!isRecord(body) || body.symbol !== "XAU") {
    throw new PriceFeedError("Gold spot response did not quote XAU.");
  }

  const price = typeof body.price === "number" ? body.price : Number(body.price);
  if (!Number.isFinite(price) || price <= 0) {
    throw new PriceFeedError("Gold spot response did not include a usable price.");
  }

  return {
    price,
    updatedAt: typeof body.updatedAt === "string" ? body.updatedAt : "",
  };
}

async function fetchUsdRates(): Promise<Record<string, number>> {
  const response = await fetch(FX_URL, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new PriceFeedError(`Exchange rate request failed (${response.status}).`);
  }

  const body: unknown = await response.json();
  if (!isRecord(body) || body.result !== "success" || !isRecord(body.rates)) {
    throw new PriceFeedError("Exchange rate response was not successful.");
  }

  const rates: Record<string, number> = {};
  for (const [code, value] of Object.entries(body.rates)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      rates[code] = value;
    }
  }
  return rates;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
