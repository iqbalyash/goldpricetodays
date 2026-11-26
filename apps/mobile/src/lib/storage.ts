import AsyncStorage from "@react-native-async-storage/async-storage";
import type { GoldRate } from "@goldpricetodays/shared";
import type { Karat, Selection } from "@/lib/quote";

const RATES_KEY = "gold.rates.v1";
const SELECTION_KEY = "gold.selection.v1";
const SAMPLES_KEY = "gold.samples.v1";
const ALERTS_KEY = "gold.alerts.v1";
const SAMPLE_GAP_MS = 15 * 60 * 1000;

export interface PriceSample {
  at: string;
  k24: number;
  k22: number;
  k21: number;
  k18: number;
}

export interface PriceAlert {
  id: string;
  countrySlug: string;
  citySlug: string | null;
  place: string;
  currencyCode: string;
  currencySymbol: string;
  karat: Extract<Karat, "k24" | "k22">;
  side: "buy" | "sell";
  target: number;
  createdAt: string;
  triggeredAt: string | null;
}

type SampleBook = Record<string, PriceSample[]>;

export async function readCachedRates(): Promise<GoldRate[] | null> {
  const raw = await AsyncStorage.getItem(RATES_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GoldRate[]) : null;
  } catch {
    return null;
  }
}

export async function writeCachedRates(rates: GoldRate[]): Promise<void> {
  await AsyncStorage.setItem(RATES_KEY, JSON.stringify(rates));
}

export async function readSelection(): Promise<Selection | null> {
  const raw = await AsyncStorage.getItem(SELECTION_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const selection = parsed as Selection;
    if (typeof selection.countrySlug !== "string") return null;
    return { countrySlug: selection.countrySlug, citySlug: selection.citySlug ?? null };
  } catch {
    return null;
  }
}

export async function writeSelection(selection: Selection): Promise<void> {
  await AsyncStorage.setItem(SELECTION_KEY, JSON.stringify(selection));
}

export async function readSamples(): Promise<SampleBook> {
  const raw = await AsyncStorage.getItem(SAMPLES_KEY);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as SampleBook) : {};
  } catch {
    return {};
  }
}

export async function recordSamples(rates: GoldRate[]): Promise<SampleBook> {
  const book = await readSamples();
  const now = new Date().toISOString();
  for (const rate of rates) {
    const key = `${rate.country.slug}:${rate.city?.slug ?? "average"}`;
    const sample: PriceSample = {
      at: now,
      k24: rate.prices.gram.k24,
      k22: rate.prices.gram.k22,
      k21: rate.prices.gram.k21,
      k18: rate.prices.gram.k18,
    };
    const series = book[key] ?? [];
    const last = series[series.length - 1];
    const unchanged =
      last &&
      last.k24 === sample.k24 &&
      last.k22 === sample.k22 &&
      Date.parse(now) - Date.parse(last.at) < SAMPLE_GAP_MS;
    if (unchanged) continue;
    book[key] = [...series, sample].slice(-500);
  }
  await AsyncStorage.setItem(SAMPLES_KEY, JSON.stringify(book));
  return book;
}

export async function readAlerts(): Promise<PriceAlert[]> {
  const raw = await AsyncStorage.getItem(ALERTS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PriceAlert[]) : [];
  } catch {
    return [];
  }
}

export async function writeAlerts(alerts: PriceAlert[]): Promise<void> {
  await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
}
