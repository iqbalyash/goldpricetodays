import type { GoldRate, GoldRatesResponse } from "@goldpricetodays/shared";

const API_ORIGIN = (process.env.EXPO_PUBLIC_API_URL ?? "https://goldpricetodays.com").replace(/\/$/, "");

export const RATES_URL = `${API_ORIGIN}/api/v1/rates`;

export async function fetchRates(): Promise<GoldRate[]> {
  const response = await fetch(RATES_URL);
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : `Could not load rates (${response.status}).`;
    throw new Error(message);
  }

  if (!isRatesResponse(body)) {
    throw new Error("Rates response was not a list of quotes.");
  }

  return body.rates.filter(isGoldRate);
}

function isRatesResponse(value: unknown): value is GoldRatesResponse {
  return typeof value === "object" && value !== null && "rates" in value && Array.isArray(value.rates);
}

function isGoldRate(value: unknown): value is GoldRate {
  if (typeof value !== "object" || value === null) return false;
  const rate = value as GoldRate;
  return (
    typeof rate.country?.slug === "string" &&
    typeof rate.country.currencyCode === "string" &&
    typeof rate.prices?.gram?.k24 === "number" &&
    typeof rate.prices.gram.k22 === "number" &&
    typeof rate.updatedAt === "string"
  );
}
