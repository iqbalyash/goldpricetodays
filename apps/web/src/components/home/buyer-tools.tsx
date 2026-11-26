"use client";

import { formatCurrency, TOLA_GRAMS } from "@goldpricetodays/shared";
import { useMemo, useState, type ReactNode } from "react";
import type { HistoryPoint, ToolCountry } from "@/lib/homepage-data";
import { PriceChart } from "@/components/home/price-chart";

const NISAB_GRAMS = 87.48;
const ZAKAT_RATE = 0.025;
const KARATS = ["k24", "k22", "k21", "k18"] as const;
const KARAT_LABEL = { k24: "24K", k22: "22K", k21: "21K", k18: "18K" } as const;

type Tab = "bill" | "scrap" | "zakat" | "history";

export function BuyerTools({
  countries,
  history,
  historyNote,
}: {
  countries: ToolCountry[];
  history: HistoryPoint[];
  historyNote: string | null;
}) {
  const [tab, setTab] = useState<Tab>("bill");
  const [countrySlug, setCountrySlug] = useState(countries[0]?.slug ?? "");
  const country = countries.find((item) => item.slug === countrySlug) ?? countries[0];

  if (!country) {
    return (
      <p className="glass rounded-2xl p-4 text-sm text-[#94A3B8]">
        Buyer tools need a per-gram gold rate. They appear when the spot and exchange-rate feeds respond.
      </p>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "bill", label: "Jewellery bill" },
    { id: "scrap", label: "Old gold exchange" },
    { id: "zakat", label: "Zakat" },
    { id: "history", label: "30-day history" },
  ];

  return (
    <section className="glass rounded-2xl" aria-labelledby="buyer-tools-heading">
      <div className="border-b border-white/10 px-4 py-4 sm:px-6">
        <h2 id="buyer-tools-heading" className="font-display text-xl font-semibold text-[#F8FAFC]">
          Buyer tools
        </h2>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Rates below are today&apos;s server-rendered {country.name} quotes. Changing country uses those
          stored rates. It does not hide the table above.
        </p>
        <label className="mt-3 block max-w-xs text-sm">
          <span className="mb-1 block font-medium text-[#F8FAFC]">Rate country</span>
          <select
            value={country.slug}
            className="field"
            onChange={(event) => setCountrySlug(event.target.value)}
          >
            {countries.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name} ({item.currencyCode})
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="relative mx-4 my-3 grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-black/40 p-1 sm:mx-6 sm:grid-cols-4" role="tablist">
        <span
          aria-hidden="true"
          className="foil pointer-events-none absolute top-1 bottom-1 left-1 hidden rounded-full transition-transform duration-300 sm:block sm:w-[calc(25%-0.25rem)]"
          style={{ transform: `translateX(${tabs.findIndex((item) => item.id === tab) * 100}%)` }}
        />
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`relative z-10 rounded-full px-3 py-1.5 text-sm font-medium transition ${
              tab === item.id
                ? "bg-gradient-to-r from-[#FDE68A] via-[#F59E0B] to-[#B45309] text-[#1C1204] shadow-[0_0_25px_rgba(245,158,11,0.22)] sm:bg-none sm:shadow-none"
                : "text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="px-4 py-5 sm:px-6">
        {tab === "bill" ? <BillCalculator key={country.slug} country={country} /> : null}
        {tab === "scrap" ? <ScrapCalculator key={country.slug} country={country} /> : null}
        {tab === "zakat" ? <ZakatCalculator key={country.slug} country={country} /> : null}
        {tab === "history" ? <PriceChart points={history} note={historyNote} /> : null}
      </div>
    </section>
  );
}

export function JewelleryBillCalculator({ country }: { country: ToolCountry }) {
  return (
    <section className="glass rounded-2xl" aria-labelledby="bill-heading">
      <div className="border-b border-white/10 px-4 py-4 sm:px-6">
        <h2 id="bill-heading" className="font-display text-xl font-semibold text-[#F8FAFC]">
          Jewellery bill
        </h2>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Starts on this market&apos;s 22K rate with local tax at {country.jewelleryTaxPercent}%. Weight,
          making charges, and tax stay editable.
        </p>
      </div>
      <div className="px-4 py-5 sm:px-6">
        <BillCalculator country={country} />
      </div>
    </section>
  );
}

function BillCalculator({ country }: { country: ToolCountry }) {
  const [karat, setKarat] = useState<(typeof KARATS)[number]>("k22");
  const [weight, setWeight] = useState("10");
  const [unit, setUnit] = useState<"gram" | "tola">("gram");
  const [makingMode, setMakingMode] = useState<"percent" | "flat">("percent");
  const [makingValue, setMakingValue] = useState("10");
  const [taxPercent, setTaxPercent] = useState(String(country.jewelleryTaxPercent));

  const bill = useMemo(() => {
    const grams = toGrams(weight, unit);
    const makingInput = Number(makingValue);
    const tax = Number(taxPercent);
    if (grams === null || !Number.isFinite(makingInput) || makingInput < 0 || !Number.isFinite(tax) || tax < 0) {
      return null;
    }
    const base = grams * country.perGram[karat];
    const making = makingMode === "percent" ? base * (makingInput / 100) : makingInput * grams;
    const taxable = base + making;
    const taxDue = taxable * (tax / 100);
    return { base, making, taxDue, total: taxable + taxDue };
  }, [country, karat, makingMode, makingValue, taxPercent, unit, weight]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_1fr]">
      <fieldset className="grid gap-3 text-sm">
        <legend className="mb-1 font-medium text-[#F8FAFC]">True jewellery bill</legend>
        <Field label="Purity">
          <select value={karat} className="field" onChange={(event) => setKarat(event.target.value as typeof karat)}>
            {KARATS.map((item) => (
              <option key={item} value={item}>
                {KARAT_LABEL[item]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Weight">
          <input value={weight} inputMode="decimal" className="field" onChange={(event) => setWeight(event.target.value)} />
          <input
            type="range"
            min="1"
            max="100"
            step="0.1"
            value={Number.isFinite(Number(weight)) ? Math.min(100, Math.max(1, Number(weight))) : 1}
            aria-label="Weight slider"
            onChange={(event) => setWeight(event.target.value)}
          />
        </Field>
        <Field label="Weight unit">
          <select value={unit} className="field" onChange={(event) => setUnit(event.target.value as typeof unit)}>
            <option value="gram">Grams</option>
            <option value="tola">Tola</option>
          </select>
        </Field>
        <Field label="Making charges">
          <select
            value={makingMode}
            className="field"
            onChange={(event) => setMakingMode(event.target.value as typeof makingMode)}
          >
            <option value="percent">Percent of gold value</option>
            <option value="flat">Flat per gram</option>
          </select>
        </Field>
        <Field label={makingMode === "percent" ? "Making percent" : "Making per gram"}>
          <input
            value={makingValue}
            inputMode="decimal"
            className="field"
            onChange={(event) => setMakingValue(event.target.value)}
          />
          {makingMode === "percent" ? (
            <input
              type="range"
              min="0"
              max="30"
              step="0.5"
              value={Number.isFinite(Number(makingValue)) ? Math.min(30, Math.max(0, Number(makingValue))) : 0}
              aria-label="Making percent slider"
              onChange={(event) => setMakingValue(event.target.value)}
            />
          ) : null}
        </Field>
        <Field label="Local GST/VAT %">
          <input
            value={taxPercent}
            inputMode="decimal"
            className="field"
            onChange={(event) => setTaxPercent(event.target.value)}
          />
          <input
            type="range"
            min="0"
            max="25"
            step="0.5"
            value={Number.isFinite(Number(taxPercent)) ? Math.min(25, Math.max(0, Number(taxPercent))) : 0}
            aria-label="Tax percent slider"
            onChange={(event) => setTaxPercent(event.target.value)}
          />
        </Field>
      </fieldset>
      <Breakdown
        currency={country.currencyCode}
        symbol={country.currencySymbol}
        rows={
          bill
            ? [
                ["Base gold value", bill.base],
                ["Making charges", bill.making],
                ["Tax", bill.taxDue],
                ["Final jeweller bill", bill.total],
              ]
            : []
        }
        empty="Enter a positive weight to calculate the bill."
      />
    </div>
  );
}

function ScrapCalculator({ country }: { country: ToolCountry }) {
  const [karat, setKarat] = useState<(typeof KARATS)[number]>("k22");
  const [weight, setWeight] = useState("10");
  const [deduction, setDeduction] = useState("3");

  const grams = toGrams(weight, "gram");
  const deductionPercent = Number(deduction);
  const valid =
    grams !== null && Number.isFinite(deductionPercent) && deductionPercent >= 0 && deductionPercent < 100;
  const gross = valid ? grams * country.perGram[karat] : 0;
  const kept = valid ? gross * (1 - deductionPercent / 100) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_1fr]">
      <fieldset className="grid gap-3 text-sm">
        <legend className="mb-1 font-medium text-[#F8FAFC]">Old gold exchange</legend>
        <Field label="Old gold purity">
          <select value={karat} className="field" onChange={(event) => setKarat(event.target.value as typeof karat)}>
            {KARATS.map((item) => (
              <option key={item} value={item}>
                {KARAT_LABEL[item]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Gross weight (grams)">
          <input value={weight} inputMode="decimal" className="field" onChange={(event) => setWeight(event.target.value)} />
        </Field>
        <Field label="Melting / purity deduction %">
          <input
            value={deduction}
            inputMode="decimal"
            className="field"
            onChange={(event) => setDeduction(event.target.value)}
          />
          <input
            type="range"
            min="0"
            max="15"
            step="0.5"
            value={Number.isFinite(Number(deduction)) ? Math.min(15, Math.max(0, Number(deduction))) : 0}
            aria-label="Deduction percent slider"
            onChange={(event) => setDeduction(event.target.value)}
          />
        </Field>
        <p className="text-xs leading-5 text-[#94A3B8]">Usual jeweller range is 2% to 5%. The default is 3%.</p>
      </fieldset>
      <Breakdown
        currency={country.currencyCode}
        symbol={country.currencySymbol}
        rows={valid ? [["Gross metal value", gross], ["Net cash / exchange value", kept]] : []}
        empty="Enter a gross weight and a deduction below 100%."
      />
    </div>
  );
}

function ZakatCalculator({ country }: { country: ToolCountry }) {
  const [weight, setWeight] = useState(String(NISAB_GRAMS));
  const grams = toGrams(weight, "gram");
  const rate = country.perGram.k24;
  const meetsNisab = grams !== null && grams >= NISAB_GRAMS;
  const payable = meetsNisab ? grams * rate * ZAKAT_RATE : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_1fr]">
      <fieldset className="grid gap-3 text-sm">
        <legend className="mb-1 font-medium text-[#F8FAFC]">Zakat on gold</legend>
        <Field label="Gold weight (grams)">
          <input value={weight} inputMode="decimal" className="field" onChange={(event) => setWeight(event.target.value)} />
          <input
            type="range"
            min="1"
            max="200"
            step="0.1"
            value={Number.isFinite(Number(weight)) ? Math.min(200, Math.max(1, Number(weight))) : 1}
            aria-label="Zakat weight slider"
            onChange={(event) => setWeight(event.target.value)}
          />
        </Field>
        <p className="text-xs leading-5 text-[#94A3B8]">
          Nisab is {NISAB_GRAMS} g (7.5 tola, {TOLA_GRAMS} g each). Today&apos;s 24K rate is{" "}
          <span className="num font-medium text-[#F8FAFC]">
            {formatCurrency(rate, country.currencyCode, country.currencySymbol)}
          </span>{" "}
          per gram.
        </p>
      </fieldset>
      <div>
        <p className="text-sm text-[#94A3B8]">
          {grams === null
            ? "Enter a weight in grams."
            : meetsNisab
              ? "This weight is at or above nisab."
              : "This weight is below nisab, so Zakat due is zero."}
        </p>
        <Breakdown
          currency={country.currencyCode}
          symbol={country.currencySymbol}
          rows={grams === null ? [] : [["Zakat payable (2.5%)", payable]]}
          empty=""
        />
      </div>
    </div>
  );
}

function Breakdown({
  currency,
  symbol,
  rows,
  empty,
}: {
  currency: string;
  symbol: string;
  rows: [string, number][];
  empty: string;
}) {
  if (rows.length === 0) return <p className="text-sm text-[#94A3B8]">{empty}</p>;
  return (
    <dl className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
      {rows.map(([label, amount], index) => {
        const total = index === rows.length - 1;
        return (
          <div
            key={label}
            className={
              total
                ? "foil flex items-baseline justify-between gap-4 px-4 py-4"
                : "flex items-baseline justify-between gap-4 border-b border-white/10 px-4 py-3"
            }
          >
            <dt className={total ? "font-semibold" : "text-[#94A3B8]"}>{label}</dt>
            <dd className={`num text-lg font-semibold ${total ? "" : "text-[#F8FAFC]"}`}>
              {formatCurrency(amount, currency, symbol)}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[#94A3B8]">{label}</span>
      {children}
    </label>
  );
}

function toGrams(value: string, unit: "gram" | "tola"): number | null {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return unit === "tola" ? amount * TOLA_GRAMS : amount;
}
