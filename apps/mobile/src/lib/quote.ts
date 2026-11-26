import { roundMoney, TOLA_GRAMS, type GoldRate } from "@goldpricetodays/shared";

export type Karat = "k24" | "k22" | "k21" | "k18";
export type WeightUnit = "gram" | "tola";

export const KARAT_LABEL: Record<Karat, string> = {
  k24: "24K",
  k22: "22K",
  k21: "21K",
  k18: "18K",
};

export interface Selection {
  countrySlug: string;
  citySlug: string | null;
}

export function selectionKey(selection: Selection): string {
  return `${selection.countrySlug}:${selection.citySlug ?? "average"}`;
}

export function rateKey(rate: GoldRate): string {
  return selectionKey({ countrySlug: rate.country.slug, citySlug: rate.city?.slug ?? null });
}

export function placeName(rate: GoldRate): string {
  return rate.city ? `${rate.city.name}, ${rate.country.name}` : `${rate.country.name} average`;
}

export function findRate(rates: GoldRate[], selection: Selection | null): GoldRate | null {
  if (!selection) return null;
  return (
    rates.find(
      (rate) => rate.country.slug === selection.countrySlug && (rate.city?.slug ?? null) === selection.citySlug,
    ) ?? null
  );
}

export function defaultSelection(rates: GoldRate[]): Selection | null {
  const preferred =
    rates.find((rate) => rate.country.slug === "pakistan" && rate.city?.slug === "karachi") ??
    rates.find((rate) => rate.country.slug === "pakistan" && rate.city === null) ??
    rates[0];
  if (!preferred) return null;
  return { countrySlug: preferred.country.slug, citySlug: preferred.city?.slug ?? null };
}

export function gramPrice(rate: GoldRate, karat: Karat): number {
  return rate.prices.gram[karat];
}

export function unitPrice(rate: GoldRate, karat: Karat, unit: WeightUnit): number {
  if (unit === "gram") return gramPrice(rate, karat);
  if (karat === "k24") return rate.prices.tola.k24;
  if (karat === "k22") return rate.prices.tola.k22;
  return roundMoney(gramPrice(rate, karat) * TOLA_GRAMS);
}

export function toGrams(amount: number, unit: WeightUnit): number | null {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return unit === "tola" ? amount * TOLA_GRAMS : amount;
}
