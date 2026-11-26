export interface GoldFaqContext {
  scope: "global" | "country" | "city";
  place: string;
  countryName?: string;
  currencyCode?: string;
  taxPercent?: number;
  dutyPercent?: number;
  premiumPercent?: number;
  marketTimings?: string;
  jewelleryTaxPercent?: number;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  id: string;
  badge: string;
  title: string;
  items: FaqItem[];
}

export function GoldFaqSection(context: GoldFaqContext) {
  const categories = buildGoldFaq(context);
  const questions = categories.flatMap((category) => category.items);
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <section aria-labelledby="gold-faq-heading" className="max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
      />
      <h2 id="gold-faq-heading" className="font-display text-xl font-semibold tracking-tight text-[#F8FAFC]">
        Gold price questions
      </h2>
      <p className="mt-2 text-sm leading-6 text-[#94A3B8]">
        Twelve answers on today&apos;s quote, purity, the live database, and the buyer calculators.
      </p>
      <div className="mt-5 space-y-5">
        {categories.map((category) => (
          <section
            key={category.id}
            aria-labelledby={category.id}
            className="glass rounded-2xl p-5"
          >
            <p className="foil inline-flex rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide uppercase">
              {category.badge}
            </p>
            <h3 id={category.id} className="font-display mt-3 text-lg font-semibold text-[#F8FAFC]">
              {category.title}
            </h3>
            <div className="mt-3 space-y-2">
              {category.items.map((item) => (
                <details
                  key={item.question}
                  className="faq-item group rounded-xl border border-white/10 bg-white/[0.03] px-4 open:border-amber-500/40 open:bg-white/[0.05]"
                >
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-3.5 text-left [&::-webkit-details-marker]:hidden">
                    <span className="text-base font-medium text-[#F8FAFC]">{item.question}</span>
                    <span className="faq-chevron mt-0.5 inline-flex h-5 w-5 shrink-0 text-[#F59E0B]">
                      <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5">
                        <path
                          fill="currentColor"
                          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                        />
                      </svg>
                    </span>
                  </summary>
                  <p className="pb-4 text-sm leading-6 text-[#94A3B8]">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function buildGoldFaq(context: GoldFaqContext): FaqCategory[] {
  const label = marketLabel(context);
  const setting = marketSetting(context);
  const jewelleryTax =
    typeof context.jewelleryTaxPercent === "number"
      ? ` The tax field starts at ${context.jewelleryTaxPercent}%.`
      : " The tax field starts from the selected country's jewellery tax and can be edited.";

  return [
    {
      id: "faq-purity",
      badge: "Price and purity",
      title: "Gold Price Today & Purity Guide",
      items: [
        {
          question: `What is the gold price for ${label}?`,
          answer: `The gold price is the live bullion value of fine gold. For ${label}, this page publishes that gold price as 24K, 22K, 21K, and 18K rates. ${setting}`,
        },
        {
          question: `How should I read the goldprice for ${label}?`,
          answer: `A goldprice is that same bullion quote written as one word. The goldprice for ${label} is the spot converted into local currency, then duty, tax, and any city premium. It is not a jewellery bill.`,
        },
        {
          question: `What does gold price today mean for ${label}?`,
          answer: `Gold price today means the current server-rendered quote for ${label}, refreshed from the latest spot and exchange rates. It is the figure in the price table on this page, not a showroom advertisement.`,
        },
        {
          question: `Why does goldprice today change for ${label}?`,
          answer: `Goldprice today changes when the XAU/USD spot, the exchange rate, or the local premium changes. ${setting} Two cities in one country share the spot and tax, then differ by that city's premium.`,
        },
        {
          question: `What is included in gold price today's quote for ${label}?`,
          answer: `Gold price today's quote for ${label} includes the international fine-gold spot, the currency conversion, import duty, bullion tax, and a city premium when the page is a city screen. Making charges are left for the jewellery calculator.`,
        },
        {
          question: `How do 24K, 22K, 21K, 18K, tola, and troy ounce conversions work for ${label}?`,
          answer: `For ${label}, 24K is fine gold. 22K is 22/24 of that price, 21K is 21/24, and 18K is 18/24. One troy ounce is 31.1034768 grams. One tola is 11.6638 grams. A city price uses those same conversions, then adds only its own premium.`,
        },
      ],
    },
    {
      id: "faq-automation",
      badge: "Live data and tools",
      title: "Live Database, Automation & Calculators",
      items: [
        {
          question: `How does the automated database price ${label}?`,
          answer: `A scheduled job fetches the XAU/USD spot and the latest USD exchange rates, calculates 24K, 22K, 21K, and 18K per gram, tola, and ounce, and stores one snapshot per country and city. Quotes for ${label} come from that snapshot when it exists, and from the same live calculation otherwise.`,
        },
        {
          question: `Why can a showroom quote for ${label} differ slightly?`,
          answer: `A showroom quote for ${label} often adds making charges, rounding, and the dealer's own spread. This page stops after duty, tax, and the published city premium, so the counter figure can sit a little above the bullion screen.`,
        },
        {
          question: `How does the Jewellery Bill Calculator price ${label}?`,
          answer: `The jewellery bill multiplies the selected karat's per-gram rate for ${label} by the weight. Making charges are a percent of that gold value or a flat amount per gram. GST or VAT is then added on gold plus making.${jewelleryTax}`,
        },
        {
          question: `How does the Old Gold Exchange Estimator treat ${label}?`,
          answer: `The old-gold estimate multiplies gross weight by the selected karat's per-gram rate for ${label}, then removes a melting or purity deduction. The deduction starts at 3 percent and is meant to sit in the usual 2 to 5 percent range.`,
        },
        {
          question: `How is Zakat calculated for ${label}?`,
          answer: `Zakat on this page uses a nisab of 87.48 grams, about 7.5 tola. If the weight is below that, Zakat is zero. If it is at or above nisab, Zakat is 2.5 percent of the weight times the 24K per-gram rate for ${label}.`,
        },
        {
          question: `How is price history archived for ${label}?`,
          answer: `The historical chart archives daily average XAU/USD troy-ounce prices when the history feed is configured. It does not invent missing days. The live table for ${label} still uses the latest snapshot or the live spot, not a guessed backfill.`,
        },
      ],
    },
  ];
}

function marketLabel(context: GoldFaqContext): string {
  if (context.scope === "city" && context.countryName) {
    return `${context.place}, ${context.countryName}`;
  }
  if (context.scope === "country") return context.place;
  return "the listed countries and cities";
}

function marketSetting(context: GoldFaqContext): string {
  if (context.scope === "global") {
    return "Each country converts the USD spot and applies its own duty and tax. Each city then adds its Sarafa or bullion premium.";
  }
  const currency = context.currencyCode ?? "local currency";
  const tax = context.taxPercent ?? 0;
  const duty = context.dutyPercent ?? 0;
  if (context.scope === "city") {
    return `${context.place} is quoted in ${currency}. Bullion tax is ${tax}% and duty is ${duty}%. The local premium is ${context.premiumPercent ?? 0}%. Market hours are ${context.marketTimings ?? "listed on this page"}.`;
  }
  return `${context.place} is quoted in ${currency}. Bullion tax is ${tax}% and duty is ${duty}%. This country screen is the average before any city premium.`;
}
