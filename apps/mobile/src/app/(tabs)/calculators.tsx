import { formatCurrency, TOLA_GRAMS } from "@goldpricetodays/shared";
import { useMemo, useState, type ReactNode } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Card, Screen } from "@/components/screen";
import { useMarket } from "@/context/market";
import { gramPrice, KARAT_LABEL, placeName, toGrams, type Karat, type WeightUnit } from "@/lib/quote";

const KARATS: Karat[] = ["k24", "k22", "k21", "k18"];

export default function CalculatorsScreen() {
  const { selectedRate } = useMarket();
  if (!selectedRate) {
    return (
      <Screen>
        <Text className="text-3xl font-semibold text-ink">Calculators</Text>
        <Card>
          <Text className="text-sm leading-5 text-muted">Choose a city on Home once rates are saved on this phone.</Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text className="text-3xl font-semibold text-ink">Calculators</Text>
      <Text className="text-sm leading-5 text-muted">Using {placeName(selectedRate)}.</Text>
      <BillCalculator key={`bill-${selectedRate.country.slug}-${selectedRate.city?.slug ?? "average"}`} />
      <ScrapCalculator key={`scrap-${selectedRate.country.slug}-${selectedRate.city?.slug ?? "average"}`} />
    </Screen>
  );
}

function BillCalculator() {
  const { selectedRate } = useMarket();
  const rate = selectedRate!;
  const [karat, setKarat] = useState<Karat>("k22");
  const [weight, setWeight] = useState("10");
  const [unit, setUnit] = useState<WeightUnit>("gram");
  const [makingMode, setMakingMode] = useState<"percent" | "flat">("percent");
  const [makingValue, setMakingValue] = useState("10");
  const [taxPercent, setTaxPercent] = useState(String(rate.country.defaultTaxPercent));

  const bill = useMemo(() => {
    const grams = toGrams(Number(weight), unit);
    const makingInput = Number(makingValue);
    const tax = Number(taxPercent);
    if (grams === null || !Number.isFinite(makingInput) || makingInput < 0 || !Number.isFinite(tax) || tax < 0) {
      return null;
    }
    const base = grams * gramPrice(rate, karat);
    const making = makingMode === "percent" ? base * (makingInput / 100) : makingInput * grams;
    const taxDue = (base + making) * (tax / 100);
    return { base, making, taxDue, total: base + making + taxDue };
  }, [karat, makingMode, makingValue, rate, taxPercent, unit, weight]);

  const money = (amount: number) => formatCurrency(amount, rate.country.currencyCode, rate.country.currencySymbol);

  return (
    <Card>
      <Text className="text-lg font-semibold text-ink">Jewellery bill</Text>
      <Text className="mt-1 text-sm leading-5 text-muted">
        22K starts at {money(gramPrice(rate, "k22"))} per gram. Tax starts at {rate.country.defaultTaxPercent}%.
      </Text>
      <Field label="Purity">
        <ChoiceRow options={KARATS.map((item) => ({ id: item, label: KARAT_LABEL[item] }))} value={karat} onChange={setKarat} />
      </Field>
      <Field label="Weight">
        <TextInput value={weight} onChangeText={setWeight} keyboardType="decimal-pad" className="rounded-xl border border-line px-4 py-3 text-base text-ink" />
      </Field>
      <Field label="Unit">
        <ChoiceRow
          options={[
            { id: "gram", label: "Grams" },
            { id: "tola", label: "Tola" },
          ]}
          value={unit}
          onChange={setUnit}
        />
      </Field>
      <Field label="Making charges">
        <ChoiceRow
          options={[
            { id: "percent", label: "Percent" },
            { id: "flat", label: "Flat / gram" },
          ]}
          value={makingMode}
          onChange={setMakingMode}
        />
      </Field>
      <Field label={makingMode === "percent" ? "Making percent" : "Making per gram"}>
        <TextInput value={makingValue} onChangeText={setMakingValue} keyboardType="decimal-pad" className="rounded-xl border border-line px-4 py-3 text-base text-ink" />
      </Field>
      <Field label="Local tax %">
        <TextInput value={taxPercent} onChangeText={setTaxPercent} keyboardType="decimal-pad" className="rounded-xl border border-line px-4 py-3 text-base text-ink" />
      </Field>
      <Breakdown
        rows={
          bill
            ? [
                ["Base gold value", money(bill.base)],
                ["Making charges", money(bill.making)],
                ["Tax", money(bill.taxDue)],
                ["Final jeweller bill", money(bill.total)],
              ]
            : []
        }
        empty="Enter a positive weight."
      />
    </Card>
  );
}

function ScrapCalculator() {
  const { selectedRate } = useMarket();
  const rate = selectedRate!;
  const [karat, setKarat] = useState<Karat>("k22");
  const [weight, setWeight] = useState("10");
  const [deduction, setDeduction] = useState("3");
  const grams = toGrams(Number(weight), "gram");
  const deductionPercent = Number(deduction);
  const valid = grams !== null && Number.isFinite(deductionPercent) && deductionPercent >= 0 && deductionPercent < 100;
  const gross = valid ? grams * gramPrice(rate, karat) : 0;
  const net = valid ? gross * (1 - deductionPercent / 100) : 0;
  const money = (amount: number) => formatCurrency(amount, rate.country.currencyCode, rate.country.currencySymbol);

  return (
    <Card>
      <Text className="text-lg font-semibold text-ink">Old gold exchange</Text>
      <Text className="mt-1 text-sm leading-5 text-muted">
        Usual melting deduction is 2% to 5%. One tola is {TOLA_GRAMS} g. This form takes grams.
      </Text>
      <Field label="Purity">
        <ChoiceRow options={KARATS.map((item) => ({ id: item, label: KARAT_LABEL[item] }))} value={karat} onChange={setKarat} />
      </Field>
      <Field label="Gross weight (grams)">
        <TextInput value={weight} onChangeText={setWeight} keyboardType="decimal-pad" className="rounded-xl border border-line px-4 py-3 text-base text-ink" />
      </Field>
      <Field label="Melting / purity deduction %">
        <TextInput value={deduction} onChangeText={setDeduction} keyboardType="decimal-pad" className="rounded-xl border border-line px-4 py-3 text-base text-ink" />
      </Field>
      <Breakdown
        rows={valid ? [["Gross metal value", money(gross)], ["Net cash / exchange value", money(net)]] : []}
        empty="Enter a gross weight and a deduction below 100%."
      />
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="mt-3 gap-2">
      <Text className="text-sm font-medium text-ink">{label}</Text>
      {children}
    </View>
  );
}

function ChoiceRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            className={`min-h-11 justify-center rounded-full px-4 py-2 ${selected ? "bg-gold" : "border border-line bg-paper"}`}
          >
            <Text className={`text-sm font-semibold ${selected ? "text-white" : "text-ink"}`}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Breakdown({ rows, empty }: { rows: [string, string][]; empty: string }) {
  if (rows.length === 0) return <Text className="mt-4 text-sm text-muted">{empty}</Text>;
  return (
    <View className="mt-4 divide-y divide-line rounded-xl border border-line">
      {rows.map(([label, amount], index) => (
        <View key={label} className="flex-row items-center justify-between gap-3 px-3 py-3">
          <Text className={index === rows.length - 1 ? "font-semibold text-ink" : "text-muted"}>{label}</Text>
          <Text className="text-base font-semibold text-ink" style={{ fontVariant: ["tabular-nums"] }}>
            {amount}
          </Text>
        </View>
      ))}
    </View>
  );
}
