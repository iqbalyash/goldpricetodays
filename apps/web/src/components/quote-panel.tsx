import type { GoldRate } from "@goldpricetodays/shared";
import { formatCurrency, formatSignedPercent } from "@goldpricetodays/shared";

export function primaryQuote(rate: GoldRate): { label: string; amount: number } {
  if (rate.country.usesTola) {
    return { label: "24K tola", amount: rate.prices.tola.k24 };
  }
  return { label: "24K gram", amount: rate.prices.gram.k24 };
}

export function QuotePanel({
  rate,
  eyebrow,
}: {
  rate: GoldRate | null;
  eyebrow: string;
}) {
  if (!rate) {
    return (
      <section className="glass rounded-3xl p-6">
        <p className="text-xs tracking-[0.18em] text-[#94A3B8] uppercase">{eyebrow}</p>
        <p className="font-display mt-3 text-3xl text-[#FDE68A]">Quote pending</p>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#94A3B8]">
          This market is in the directory. Prices appear after the update job stores a snapshot.
        </p>
      </section>
    );
  }

  const headline = primaryQuote(rate);
  const changeClass =
    rate.change24hPercent > 0 ? "text-up" : rate.change24hPercent < 0 ? "text-down" : "text-muted";

  return (
    <section className="glass rounded-3xl p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.18em] text-[#94A3B8] uppercase">{eyebrow}</p>
          <p className="mt-2 text-sm text-[#94A3B8]">{headline.label}</p>
          <p className="num text-4xl tracking-tight text-[#F8FAFC] sm:text-5xl">
            {formatCurrency(headline.amount, rate.country.currencyCode, rate.country.currencySymbol)}
          </p>
        </div>
        <p className={`font-display text-2xl ${changeClass}`}>
          {formatSignedPercent(rate.change24hPercent)}
          <span className="mt-1 block text-xs tracking-normal text-[#94A3B8]">24h, 24K gram</span>
        </p>
      </div>
      <QuoteTable rate={rate} />
      <p className="mt-4 text-xs leading-5 text-[#94A3B8]">
        Updated {new Date(rate.updatedAt).toLocaleString("en-GB", { hour12: false, timeZoneName: "short" })}.
        Duty {rate.country.defaultDutyPercent}% then tax {rate.country.defaultTaxPercent}%
        {rate.city ? `, then a ${rate.city.localPremiumPercent}% ${rate.city.name} premium` : ", with no city premium"}.
      </p>
    </section>
  );
}

function QuoteTable({ rate }: { rate: GoldRate }) {
  const code = rate.country.currencyCode;
  const symbol = rate.country.currencySymbol;
  const money = (amount: number) => formatCurrency(amount, code, symbol);
  const rows = [
    ["24K / gram", money(rate.prices.gram.k24), rate.country.usesTola ? false : true],
    ["22K / gram", money(rate.prices.gram.k22), false],
    ["21K / gram", money(rate.prices.gram.k21), false],
    ["18K / gram", money(rate.prices.gram.k18), false],
    ["24K / tola", money(rate.prices.tola.k24), rate.country.usesTola],
    ["22K / tola", money(rate.prices.tola.k22), false],
    ["24K / ounce", money(rate.prices.ounce.k24), false],
  ] as const;

  return (
    <table className="mt-6 w-full border-collapse text-sm">
      <caption className="sr-only">Karat prices</caption>
      <tbody>
        {rows.map(([label, value, emphasized]) => (
          <tr key={label} className={emphasized ? "bg-amber-500/[0.06]" : "even:bg-white/[0.015]"}>
            <th scope="row" className="border-t border-white/10 px-3 py-2.5 text-left font-medium">
              {label}
            </th>
            <td className="num border-t border-white/10 px-3 py-2.5 text-right text-base">
              {value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function RatesFallback() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-16">
      <div className="h-8 w-40 animate-pulse rounded-full bg-white/10" />
      <div className="glass mt-6 h-48 animate-pulse rounded-3xl" />
    </div>
  );
}

export function StatusBanner({
  catalogStatus,
  hasQuotes,
}: {
  catalogStatus: "unconfigured" | "ready";
  hasQuotes: boolean;
}) {
  if (catalogStatus === "unconfigured") {
    return (
      <p className="glass rounded-2xl px-4 py-3 text-sm leading-6 text-[#FDE68A]">
        No database is connected. The directory below is the seeded market list. Add a Supabase
        Postgres URL, migrate, seed, then run the price update.
      </p>
    );
  }
  if (!hasQuotes) {
    return (
      <p className="glass rounded-2xl px-4 py-3 text-sm leading-6 text-[#94A3B8]">
        Markets are ready. Stored quotes appear after the price update runs.
      </p>
    );
  }
  return null;
}
