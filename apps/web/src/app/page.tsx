import { cacheLife, cacheTag } from "next/cache";
import type { Metadata } from "next";
import Link from "next/link";
import { formatCurrency, formatSignedPercent } from "@goldpricetodays/shared";
import { BuyerTools } from "@/components/home/buyer-tools";
import { MarketSwitcher } from "@/components/home/market-switcher";
import { UpdatedBadge } from "@/components/home/updated-badge";
import { GoldFaqSection } from "@/components/GoldFaqSection";
import { DATASET_DESCRIPTION, loadHomepageData, type ComparisonRow, type UnitPrices } from "@/lib/homepage-data";

export const metadata: Metadata = {
  title: {
    absolute: "Gold Price Today – Live 24K & 22K Goldprice by Country & City",
  },
  description:
    "Gold price today and goldprice today, with gold price today's live 24K and 22K rates by country and city. XAU/USD spot, local currency, duty, tax, and city premiums.",
};

const KARAT_ROWS = [
  ["24K", "k24"],
  ["22K", "k22"],
  ["21K", "k21"],
  ["18K", "k18"],
] as const;

export default async function HomePage() {
  "use cache";
  cacheLife({ stale: 900, revalidate: 900, expire: 86400 });
  cacheTag("gold-rates");

  const data = await loadHomepageData();
  const worldwide = data.worldwide;
  const updatedIso = data.snapshotUpdatedAt ?? data.spotUpdatedAt;
  const updatedSource = data.snapshotUpdatedAt ? "database snapshot" : "spot feed";
  const schema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Gold Price Today live bullion rates",
    description: DATASET_DESCRIPTION,
    url: "https://goldpricetodays.com/",
    creator: {
      "@type": "Organization",
      name: "Gold Price Today",
      url: "https://goldpricetodays.com",
    },
    variableMeasured: [
      "XAU/USD per troy ounce",
      "XAG/USD per troy ounce",
      "24K gold per gram",
      "22K gold per gram",
      "21K gold per gram",
      "18K gold per gram",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
      />
      <Ticker data={data} />
      <div className="relative">
        <div aria-hidden="true" className="hero-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem]" />
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-8">
        <section aria-labelledby="gold-heading">
          <h1 id="gold-heading" className="metal-title font-display max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Gold Price Today: Live Global &amp; Local Bullion Rates
          </h1>
          <div className="mt-4">
            {updatedIso ? (
              <UpdatedBadge iso={updatedIso} source={updatedSource} />
            ) : (
              <p className="text-sm text-[#94A3B8]">No timestamp is available from the spot feed or the database.</p>
            )}
          </div>
          {data.feedNote ? <p className="mt-3 text-sm text-[#94A3B8]">{data.feedNote}</p> : null}
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[#94A3B8]">
            Gold price today starts from the international fine-gold spot and is shown here as live 24K, 22K, 21K,
            and 18K bullion rates. The cards below are the global USD quote per gram, 10 grams, tola, and troy ounce.
            Country and city rows later on this page convert that spot and add duty, tax, and any local premium.
          </p>
          {worldwide ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {KARAT_ROWS.map(([label, key]) => (
                <KpiCard key={key} label={label} prices={worldwide[key]} change={data.change24hPercent} />
              ))}
            </div>
          ) : null}
          <div className="glass mt-6 rounded-2xl p-4">
            <h2 className="font-display text-sm font-semibold text-[#F8FAFC]">Country and city</h2>
            <div className="mt-3">
              <MarketSwitcher markets={data.markets} />
            </div>
          </div>
        </section>

        <section aria-labelledby="comparison-heading">
          <h2 id="comparison-heading" className="font-display text-xl font-semibold text-[#F8FAFC]">
            Country and major city comparison
          </h2>
          <p className="mt-1 text-sm text-[#94A3B8]">
            USD values use the latest USD exchange rate. Open any row for that market&apos;s page.
          </p>
          <div className="glass mt-4 overflow-x-auto rounded-2xl">
            <ComparisonTable rows={data.rows} />
          </div>
        </section>

        <section aria-labelledby="calculation-heading" className="max-w-3xl">
          <h2 id="calculation-heading" className="font-display text-xl font-semibold text-[#F8FAFC]">
            How Today&apos;s Goldprice Is Calculated Across Global &amp; Local Markets
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-6 text-[#94A3B8]">
            <p>
              The international spot is the XAU/USD price for one troy ounce of fine gold, 31.1034768 grams. 24K uses
              that fine-gold price. 22K is 22/24, 21K is 21/24, and 18K is 18/24. A tola is 11.6638 grams.
            </p>
            <p>
              Currency conversion multiplies the USD spot by the live rate for each local currency, such as the
              rupee, dirham, riyal, or pound. A country quote then applies that country&apos;s import duty and tax.
              Those charges are editable market settings, not a separate statutory feed.
            </p>
            <p>
              A city quote adds the Sarafa or bullion premium after duty and tax. Karachi, Rawalpindi, Mumbai, Dubai,
              Riyadh, New York, and London each keep their own premium, market hours, and description, so the local
              screen is not a copy of the country average.
            </p>
          </div>
        </section>

        <BuyerTools countries={data.tools} history={data.history} historyNote={data.historyNote} />

        <section aria-labelledby="buyer-plan-heading" className="max-w-3xl">
          <h2 id="buyer-plan-heading" className="font-display text-xl font-semibold text-[#F8FAFC]">
            Plan Your Purchase with Gold Price Today&apos;s Buyer Tools
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#94A3B8]">
            Gold price today&apos;s buyer tools use the server-rendered country rate you select. Compare a jewellery
            bill, an old-gold exchange value, Zakat against the 87.48 gram nisab, or the saved spot history without
            leaving this page.
          </p>
        </section>

        <GoldFaqSection scope="global" place="listed markets" />

        <section aria-labelledby="dataset-heading" className="glass rounded-2xl p-5">
          <h2 id="dataset-heading" className="font-display text-xl font-semibold text-[#F8FAFC]">
            About this dataset
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#94A3B8]">{DATASET_DESCRIPTION}</p>
        </section>
      </div>
      </div>
    </>
  );
}

function Ticker({
  data,
}: {
  data: Awaited<ReturnType<typeof loadHomepageData>>;
}) {
  return (
    <div className="sticky top-14 z-30 border-b border-white/10 bg-[#07090E]/80 text-[#F8FAFC] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[0.65rem] font-semibold tracking-[0.16em] text-[#10B981] uppercase">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Live feed
          </p>
          <dl className="flex flex-wrap gap-2 text-sm">
            <div className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 shadow-[0_0_25px_rgba(245,158,11,0.22)]">
              <dt className="text-[0.65rem] tracking-wide text-[#94A3B8] uppercase">Spot gold XAU/USD</dt>
              <dd className="num text-sm font-semibold text-[#FDE68A]">
                {data.goldUsdPerOunce === null ? "—" : `${formatCurrency(data.goldUsdPerOunce, "USD", "$")} / oz`}
              </dd>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
              <dt className="text-[0.65rem] tracking-wide text-[#94A3B8] uppercase">Spot silver XAG/USD</dt>
              <dd className="num text-sm font-semibold text-[#F8FAFC]">
                {data.silverUsdPerOunce === null ? "—" : `${formatCurrency(data.silverUsdPerOunce, "USD", "$")} / oz`}
              </dd>
            </div>
          </dl>
        </div>
        <nav aria-label="Top countries" className="flex flex-wrap gap-2 text-sm">
          {data.markets.map((market) => (
            <Link
              key={market.slug}
              href={`/gold-price/${market.slug}`}
              className="rounded-full border border-white/10 px-3 py-1 text-[#F8FAFC] transition hover:border-amber-400/40 hover:text-[#FDE68A]"
            >
              {market.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  prices,
  change,
}: {
  label: string;
  prices: UnitPrices | null;
  change: number | null;
}) {
  const changeClass =
    change === null
      ? "border-white/10 bg-white/5 text-[#94A3B8]"
      : change > 0
        ? "border-emerald-500/20 bg-emerald-500/10 text-[#10B981]"
        : change < 0
          ? "border-rose-500/20 bg-rose-500/10 text-[#F43F5E]"
          : "border-white/10 bg-white/5 text-[#94A3B8]";
  const featured = label === "24K";
  return (
    <article
      className={`glass relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/40 ${
        featured ? "shadow-[0_0_25px_rgba(245,158,11,0.22)]" : ""
      }`}
    >
      <span aria-hidden="true" className="pointer-events-none absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-white/15 to-transparent" />
      <div className="relative flex items-center justify-between gap-3">
        <h2
          className={
            featured
              ? "foil rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide uppercase"
              : "rounded-full border border-white/15 px-2.5 py-1 text-xs font-semibold tracking-wide text-[#F8FAFC] uppercase"
          }
        >
          {label}
        </h2>
        <span className={`num rounded-full border px-2 py-0.5 text-xs font-medium ${changeClass}`}>
          {change === null ? "24h —" : `${formatSignedPercent(change)} 24h`}
        </span>
      </div>
      <dl className="relative mt-3 space-y-1.5 text-sm">
        <PriceLine label="Gram" amount={prices?.gram ?? null} />
        <PriceLine label="10 grams" amount={prices?.tenGram ?? null} />
        <PriceLine label="Tola" amount={prices?.tola ?? null} />
        <PriceLine label="Troy ounce" amount={prices?.ounce ?? null} />
      </dl>
    </article>
  );
}

function PriceLine({ label, amount }: { label: string; amount: number | null }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[#94A3B8]">{label}</dt>
      <dd className="num font-semibold text-[#F8FAFC]">
        {amount === null ? "—" : formatCurrency(amount, "USD", "$")}
      </dd>
    </div>
  );
}

function ComparisonTable({ rows }: { rows: ComparisonRow[] }) {
  return (
    <table className="w-full min-w-[44rem] border-collapse text-sm">
      <caption className="sr-only">24K and 22K gold prices by country and city, in local currency and USD</caption>
      <thead className="sticky top-0 z-10 bg-slate-900/90 text-left text-xs tracking-wide text-[#94A3B8] uppercase backdrop-blur">
        <tr>
          <th scope="col" className="px-4 py-3 font-medium">
            Market
          </th>
          <th scope="col" className="px-4 py-3 text-right font-medium">
            24K local / g
          </th>
          <th scope="col" className="px-4 py-3 text-right font-medium">
            22K local / g
          </th>
          <th scope="col" className="px-4 py-3 text-right font-medium">
            24K USD / g
          </th>
          <th scope="col" className="px-4 py-3 text-right font-medium">
            22K USD / g
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className="border-t border-white/10 even:bg-white/[0.015] hover:bg-amber-500/[0.06]">
            <th scope="row" className={`px-4 py-3 text-left font-medium ${row.place === "city" ? "pl-8" : ""}`}>
              <Link
                href={row.href}
                className="rounded-full border border-white/10 px-2.5 py-1 text-[#F8FAFC] transition hover:border-amber-400/40 hover:text-[#FDE68A]"
              >
                {row.label}
              </Link>
              <span className="ml-2 text-xs font-normal text-[#94A3B8]">{row.currencyCode}</span>
            </th>
            <td className="num px-4 py-3 text-right text-[#F8FAFC]">{money(row.local24kGram, row.currencyCode)}</td>
            <td className="num px-4 py-3 text-right text-[#F8FAFC]">{money(row.local22kGram, row.currencyCode)}</td>
            <td className="num px-4 py-3 text-right text-[#F8FAFC]">{money(row.usd24kGram, "USD")}</td>
            <td className="num px-4 py-3 text-right text-[#F8FAFC]">{money(row.usd22kGram, "USD")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function money(amount: number | null, currency: string) {
  if (amount === null) return "—";
  return formatCurrency(amount, currency);
}
