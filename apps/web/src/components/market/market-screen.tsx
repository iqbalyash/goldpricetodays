import { formatCurrency } from "@goldpricetodays/shared";
import Link from "next/link";
import { JewelleryBillCalculator } from "@/components/home/buyer-tools";
import { GoldFaqSection } from "@/components/GoldFaqSection";
import type { MarketPageModel, PurityRow } from "@/lib/market-pages";

const ORIGIN = "https://goldpricetodays.com";

export function MarketScreen({ page }: { page: MarketPageModel }) {
  const place = page.cityName ?? page.countryName;
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: page.breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${ORIGIN}${crumb.href}`,
    })),
  };

  return (
    <div className="relative mx-auto max-w-6xl space-y-8 px-5 py-8">
      <div aria-hidden="true" className="hero-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem]" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#94A3B8]">
          {page.breadcrumbs.map((crumb, index) => {
            const current = index === page.breadcrumbs.length - 1;
            return (
              <li key={crumb.href} className="flex items-center gap-2">
                {index > 0 ? <span aria-hidden="true">&gt;</span> : null}
                {current ? (
                  <span aria-current="page" className="font-medium text-[#F8FAFC]">
                    {crumb.name}
                  </span>
                ) : (
                  <Link href={crumb.href} className="hover:text-[#FDE68A]">
                    {crumb.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <header>
        <h1 className="metal-title font-display max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          {liveHeading(page, place)}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#94A3B8]">{liveIntro(page)}</p>
        <p className="num mt-2 text-sm text-[#94A3B8]">
          {page.currencyCode}
          {page.kind === "city" ? ` · +${page.premiumPercent}% local premium` : " · country average, no city premium"}
          {page.updatedAt ? ` · updated ${page.updatedAt}` : ""}
        </p>
      </header>

      {page.kind === "city" ? (
        <section className="glass rounded-2xl px-5 py-4" aria-labelledby="buyer-guide-heading">
          <h2 id="buyer-guide-heading" className="font-display text-lg font-semibold text-[#F8FAFC]">
            Local Bullion Benchmark &amp; Buyer Guide
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#94A3B8]">{page.localDescription}</p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[#94A3B8]">Sarafa / bullion hours</dt>
              <dd className="font-medium text-[#F8FAFC]">{page.marketTimings}</dd>
            </div>
            <div>
              <dt className="text-[#94A3B8]">Local premium</dt>
              <dd className="num font-medium text-[#FDE68A]">{page.premiumPercent}%</dd>
            </div>
          </dl>
        </section>
      ) : null}

      <section className="glass rounded-2xl px-5 py-4" aria-labelledby="market-summary-heading">
        <h2 id="market-summary-heading" className="font-display text-lg font-semibold text-[#F8FAFC]">
          {place} market summary
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#94A3B8]">{page.summary}</p>
      </section>

      <section aria-labelledby="purity-heading">
        <h2 id="purity-heading" className="font-display text-xl font-semibold text-[#F8FAFC]">
          {place} purity prices
        </h2>
        {page.rows ? (
          <div className="glass mt-3 overflow-x-auto rounded-2xl">
            <PurityTable place={place} rows={page.rows} currencyCode={page.currencyCode} symbol={page.currencySymbol} />
          </div>
        ) : (
          <p className="glass mt-3 rounded-2xl px-5 py-4 text-sm text-[#94A3B8]">
            Live rates for {place} are unavailable until the spot and exchange-rate feeds respond.
          </p>
        )}
      </section>

      {page.tool ? <JewelleryBillCalculator country={page.tool} /> : null}

      <section aria-labelledby="neighbors-heading">
        <h2 id="neighbors-heading" className="font-display text-xl font-semibold text-[#F8FAFC]">
          {page.kind === "city" ? `Other cities in ${page.countryName}` : `Cities in ${page.countryName}`}
        </h2>
        {page.neighbors.length > 0 ? (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {page.neighbors.map((neighbor) => (
              <li key={neighbor.href}>
                <Link
                  href={neighbor.href}
                  className="glass block rounded-2xl px-4 py-4 transition hover:-translate-y-0.5 hover:border-amber-400/40"
                >
                  <span className="block font-semibold text-[#F8FAFC]">{neighbor.name}</span>
                  <span className="mt-1 block text-sm text-[#94A3B8]">{neighbor.detail}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[#94A3B8]">
            {place} is the only listed city in {page.countryName}.{" "}
            <Link href={`/gold-price/${page.countrySlug}`} className="font-medium text-[#FDE68A] hover:underline">
              View the {page.countryName} average
            </Link>
            .
          </p>
        )}
      </section>

      <GoldFaqSection
        scope={page.kind}
        place={place}
        countryName={page.countryName}
        currencyCode={page.currencyCode}
        taxPercent={page.taxPercent}
        dutyPercent={page.dutyPercent}
        premiumPercent={page.premiumPercent}
        marketTimings={page.marketTimings}
        jewelleryTaxPercent={page.jewelleryTaxPercent}
      />
    </div>
  );
}

function liveHeading(page: MarketPageModel, place: string): string {
  const fine = page.rows?.find((row) => row.karat === "24K");
  if (!fine) return `Gold Price Today in ${place}`;
  const gram = formatCurrency(fine.gram, page.currencyCode, page.currencySymbol);
  return `Gold Price Today in ${place}: ${gram} per gram`;
}

function liveIntro(page: MarketPageModel): string {
  const marketName = page.cityName ?? page.countryName;
  const currency = page.currencyCode;
  const fine = page.rows?.find((row) => row.karat === "24K");
  const standard = page.rows?.find((row) => row.karat === "22K");
  if (!fine || !standard) {
    return `Gold price today in ${marketName} is quoted in ${currency}. Bullion tax is ${page.taxPercent}%. The live 24K gram, 24K tola, and 22K gram rates appear when the spot and exchange-rate feeds respond.`;
  }
  const money = (amount: number) => formatCurrency(amount, page.currencyCode, page.currencySymbol);
  return `Gold price today in ${marketName}: 24K is ${money(fine.gram)} per gram and ${money(fine.tola)} per tola. 22K is ${money(standard.gram)} per gram. Currency is ${currency}. Bullion tax is ${page.taxPercent}%.`;
}

function PurityTable({
  place,
  rows,
  currencyCode,
  symbol,
}: {
  place: string;
  rows: PurityRow[];
  currencyCode: string;
  symbol: string;
}) {
  return (
    <table className="w-full min-w-[44rem] border-collapse text-sm">
      <caption className="sr-only">
        {place} 24K, 22K, 21K, and 18K gold prices for 1 gram, 8 grams, 10 grams, 1 tola, and 1 troy ounce
      </caption>
      <thead className="sticky top-0 z-10 bg-slate-900/90 text-left text-xs tracking-wide text-[#94A3B8] uppercase backdrop-blur">
        <tr>
          <th scope="col" className="px-4 py-3 font-medium">
            Purity
          </th>
          <th scope="col" className="px-4 py-3 text-right font-medium">
            1 gram
          </th>
          <th scope="col" className="px-4 py-3 text-right font-medium">
            8 grams
          </th>
          <th scope="col" className="px-4 py-3 text-right font-medium">
            10 grams
          </th>
          <th scope="col" className="px-4 py-3 text-right font-medium">
            1 tola
          </th>
          <th scope="col" className="px-4 py-3 text-right font-medium">
            1 ounce
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.karat} className="border-t border-white/10 even:bg-white/[0.015] hover:bg-amber-500/[0.06]">
            <th scope="row" className="px-4 py-3 text-left font-medium text-[#F8FAFC]">
              {row.karat === "24K" ? <span className="foil rounded-full px-2.5 py-1 text-xs">{row.karat}</span> : row.karat}
            </th>
            <PriceCell amount={row.gram} currencyCode={currencyCode} symbol={symbol} />
            <PriceCell amount={row.eightGram} currencyCode={currencyCode} symbol={symbol} />
            <PriceCell amount={row.tenGram} currencyCode={currencyCode} symbol={symbol} />
            <PriceCell amount={row.tola} currencyCode={currencyCode} symbol={symbol} />
            <PriceCell amount={row.ounce} currencyCode={currencyCode} symbol={symbol} />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PriceCell({
  amount,
  currencyCode,
  symbol,
}: {
  amount: number;
  currencyCode: string;
  symbol: string;
}) {
  return (
    <td className="num px-4 py-3 text-right font-semibold text-[#F8FAFC]">
      {formatCurrency(amount, currencyCode, symbol)}
    </td>
  );
}
