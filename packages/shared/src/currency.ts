import { roundMoney } from "./gold";

const LOCALE_BY_CURRENCY: Record<string, string> = {
  PKR: "en-PK",
  INR: "en-IN",
  AED: "en-AE",
  USD: "en-US",
};

export function formatCurrency(
  amount: number,
  currencyCode: string,
  currencySymbol = "",
): string {
  if (!Number.isFinite(amount)) {
    throw new RangeError("Amount must be a finite number");
  }

  const locale = LOCALE_BY_CURRENCY[currencyCode] ?? "en-US";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    const symbol = currencySymbol || currencyCode;
    return `${symbol} ${amount.toFixed(2)}`;
  }
}

export function formatSignedPercent(value: number): string {
  if (!Number.isFinite(value)) {
    throw new RangeError("Percent must be a finite number");
  }
  const rounded = roundMoney(value, 2);
  const body = Math.abs(rounded).toFixed(2);
  if (rounded > 0) return `+${body}%`;
  if (rounded < 0) return `-${body}%`;
  return `${body}%`;
}
