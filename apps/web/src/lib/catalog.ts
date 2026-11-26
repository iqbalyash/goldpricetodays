import type { GoldRate, GoldRateCity, GoldRateCountry } from "@goldpricetodays/shared";
import type { City, Country, GoldPriceSnapshot } from "@/generated/prisma/client";
import { seedMarkets, type SeedCountry } from "@/lib/markets";
import { getPrisma } from "@/lib/prisma";

export interface MarketCityView {
  slug: string;
  name: string;
  localPremiumPercent: number;
  marketTimings: string;
  localDescription: string;
  rate: GoldRate | null;
}

export interface MarketCountryView {
  slug: string;
  name: string;
  currencyCode: string;
  currencySymbol: string;
  usesTola: boolean;
  defaultTaxPercent: number;
  defaultDutyPercent: number;
  average: GoldRate | null;
  cities: MarketCityView[];
}

export interface MarketCatalog {
  status: "unconfigured" | "ready";
  countries: MarketCountryView[];
}

export function decimalToNumber(value: { toString(): string } | number): number {
  const numeric = typeof value === "number" ? value : Number(value.toString());
  if (!Number.isFinite(numeric)) {
    throw new Error("Expected a numeric database value");
  }
  return numeric;
}

function countryFields(country: {
  slug: string;
  name: string;
  currencyCode: string;
  currencySymbol: string;
  usesTola: boolean;
  defaultTaxPercent: { toString(): string } | number;
  defaultDutyPercent: { toString(): string } | number;
}): GoldRateCountry {
  return {
    slug: country.slug,
    name: country.name,
    currencyCode: country.currencyCode,
    currencySymbol: country.currencySymbol,
    usesTola: country.usesTola,
    defaultTaxPercent: decimalToNumber(country.defaultTaxPercent),
    defaultDutyPercent: decimalToNumber(country.defaultDutyPercent),
  };
}

function cityFields(city: {
  slug: string;
  name: string;
  localPremiumPercent: { toString(): string } | number;
  marketTimings: string;
  localDescription: string;
}): GoldRateCity {
  return {
    slug: city.slug,
    name: city.name,
    localPremiumPercent: decimalToNumber(city.localPremiumPercent),
    marketTimings: city.marketTimings,
    localDescription: city.localDescription,
  };
}

export function toGoldRate(
  snapshot: GoldPriceSnapshot,
  country: Country,
  city: City | null,
): GoldRate {
  return {
    country: countryFields(country),
    city: city ? cityFields(city) : null,
    prices: {
      gram: {
        k24: decimalToNumber(snapshot.price24kGram),
        k22: decimalToNumber(snapshot.price22kGram),
        k21: decimalToNumber(snapshot.price21kGram),
        k18: decimalToNumber(snapshot.price18kGram),
      },
      tola: {
        k24: decimalToNumber(snapshot.price24kTola),
        k22: decimalToNumber(snapshot.price22kTola),
      },
      ounce: {
        k24: decimalToNumber(snapshot.price24kOunce),
      },
    },
    change24hPercent: decimalToNumber(snapshot.change24hPercent),
    updatedAt: snapshot.updatedAt.toISOString(),
  };
}

function seedCountryView(country: SeedCountry): MarketCountryView {
  return {
    slug: country.slug,
    name: country.name,
    currencyCode: country.currencyCode,
    currencySymbol: country.currencySymbol,
    usesTola: country.usesTola,
    defaultTaxPercent: country.defaultTaxPercent,
    defaultDutyPercent: country.defaultDutyPercent,
    average: null,
    cities: country.cities.map((city) => ({
      slug: city.slug,
      name: city.name,
      localPremiumPercent: city.localPremiumPercent,
      marketTimings: city.marketTimings,
      localDescription: city.localDescription,
      rate: null,
    })),
  };
}

export function unconfiguredCatalog(): MarketCatalog {
  return {
    status: "unconfigured",
    countries: seedMarkets.map(seedCountryView),
  };
}

export async function loadMarketCatalog(): Promise<MarketCatalog> {
  const prisma = getPrisma();
  const countries = await prisma.country.findMany({
    include: {
      cities: { orderBy: { name: "asc" } },
      snapshots: { include: { city: true } },
    },
    orderBy: { name: "asc" },
  });

  return {
    status: "ready",
    countries: countries.map((country) => {
      const averageRow = country.snapshots.find((snapshot) => snapshot.cityId === null);
      return {
        ...countryFields(country),
        average: averageRow ? toGoldRate(averageRow, country, null) : null,
        cities: country.cities.map((city) => {
          const row = country.snapshots.find((snapshot) => snapshot.cityId === city.id);
          return {
            ...cityFields(city),
            rate: row ? toGoldRate(row, country, city) : null,
          };
        }),
      };
    }),
  };
}

export function findDisplayedCountry(
  catalog: MarketCatalog,
  slug: string,
): MarketCountryView | null {
  if (catalog.countries.length > 0) {
    return catalog.countries.find((country) => country.slug === slug) ?? null;
  }
  const seeded = seedMarkets.find((country) => country.slug === slug);
  return seeded ? seedCountryView(seeded) : null;
}

export function displayedCountries(catalog: MarketCatalog): MarketCountryView[] {
  if (catalog.countries.length > 0) {
    return catalog.countries;
  }
  return seedMarkets.map(seedCountryView);
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function readSlug(value: string | null): string | null | "invalid" {
  if (value === null || value.trim() === "") return null;
  const slug = value.trim().toLowerCase();
  return SLUG.test(slug) ? slug : "invalid";
}

export async function listStoredRates(filter: {
  countrySlug: string | null;
  citySlug: string | null;
}): Promise<
  | { status: "ready"; rates: GoldRate[] }
  | { status: "not_found"; which: "country" | "city" }
> {
  const prisma = getPrisma();

  if (filter.countrySlug) {
    const country = await prisma.country.findUnique({
      where: { slug: filter.countrySlug },
    });
    if (!country) return { status: "not_found", which: "country" };

    if (filter.citySlug) {
      const city = await prisma.city.findUnique({
        where: {
          countryId_slug: { countryId: country.id, slug: filter.citySlug },
        },
      });
      if (!city) return { status: "not_found", which: "city" };
    }
  }

  const rows = await prisma.goldPriceSnapshot.findMany({
    where: {
      country: filter.countrySlug ? { slug: filter.countrySlug } : undefined,
      city: filter.citySlug ? { slug: filter.citySlug } : undefined,
    },
    include: { country: true, city: true },
  });

  return {
    status: "ready",
    rates: rows.map((row) => toGoldRate(row, row.country, row.city)).sort(compareRates),
  };
}

function compareRates(left: GoldRate, right: GoldRate): number {
  const byCountry = left.country.name.localeCompare(right.country.name);
  if (byCountry !== 0) return byCountry;
  if (left.city === null && right.city !== null) return -1;
  if (left.city !== null && right.city === null) return 1;
  return (left.city?.name ?? "").localeCompare(right.city?.name ?? "");
}
