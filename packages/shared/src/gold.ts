/**
 * XAU spot is quoted in USD per troy ounce of fine (24K) gold.
 * 22K, 21K, and 18K are 22/24, 21/24, and 18/24 of that fine-gold price.
 * Duty, tax, and the city premium are applied in that order.
 * A country-wide average uses a local premium of 0.
 */
export const TROY_OUNCE_GRAMS = 31.1034768;
export const TOLA_GRAMS = 11.6638;

const KARAT_FACTORS = {
  k24: 24 / 24,
  k22: 22 / 24,
  k21: 21 / 24,
  k18: 18 / 24,
} as const;

export interface LocalGoldQuoteInput {
  spotUsdPerOunce: number;
  usdToLocalRate: number;
  taxPercent: number;
  dutyPercent: number;
  localPremiumPercent: number;
}

export interface LocalGoldQuote {
  price24kGram: number;
  price22kGram: number;
  price21kGram: number;
  price18kGram: number;
  price24kTola: number;
  price22kTola: number;
  price24kOunce: number;
}

export function roundMoney(value: number, fractionDigits = 4): number {
  if (!Number.isFinite(value)) {
    throw new RangeError("Amount must be a finite number");
  }
  const factor = 10 ** fractionDigits;
  return Math.round(value * factor) / factor;
}

function assertPercent(label: string, value: number) {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${label} must be a finite number`);
  }
}

function applyRetailAdjustments(
  base: number,
  dutyPercent: number,
  taxPercent: number,
  localPremiumPercent: number,
): number {
  const afterDuty = base * (1 + dutyPercent / 100);
  const afterTax = afterDuty * (1 + taxPercent / 100);
  return afterTax * (1 + localPremiumPercent / 100);
}

export function calculateLocalGoldPrices(input: LocalGoldQuoteInput): LocalGoldQuote {
  if (!Number.isFinite(input.spotUsdPerOunce) || input.spotUsdPerOunce <= 0) {
    throw new RangeError("Spot price must be a positive number of USD per troy ounce");
  }
  if (!Number.isFinite(input.usdToLocalRate) || input.usdToLocalRate <= 0) {
    throw new RangeError("Exchange rate must be a positive USD conversion rate");
  }
  assertPercent("Tax", input.taxPercent);
  assertPercent("Duty", input.dutyPercent);
  assertPercent("Local premium", input.localPremiumPercent);

  const fineGram = (input.spotUsdPerOunce / TROY_OUNCE_GRAMS) * input.usdToLocalRate;
  const adjust = (base: number) =>
    applyRetailAdjustments(base, input.dutyPercent, input.taxPercent, input.localPremiumPercent);

  const price24kGram = adjust(fineGram * KARAT_FACTORS.k24);
  const price22kGram = adjust(fineGram * KARAT_FACTORS.k22);
  const price21kGram = adjust(fineGram * KARAT_FACTORS.k21);
  const price18kGram = adjust(fineGram * KARAT_FACTORS.k18);
  const price24kOunce = adjust(input.spotUsdPerOunce * input.usdToLocalRate);

  return {
    price24kGram: roundMoney(price24kGram),
    price22kGram: roundMoney(price22kGram),
    price21kGram: roundMoney(price21kGram),
    price18kGram: roundMoney(price18kGram),
    price24kTola: roundMoney(price24kGram * TOLA_GRAMS),
    price22kTola: roundMoney(price22kGram * TOLA_GRAMS),
    price24kOunce: roundMoney(price24kOunce),
  };
}

/** Percent move from the previous 24K gram price. Returns 0 when there is no baseline. */
export function percentChange(previous: number, next: number): number {
  if (!Number.isFinite(previous) || previous === 0 || !Number.isFinite(next)) {
    return 0;
  }
  return roundMoney(((next - previous) / previous) * 100);
}
