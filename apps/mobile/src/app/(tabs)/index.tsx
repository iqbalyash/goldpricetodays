import { formatCurrency, formatSignedPercent, TOLA_GRAMS } from "@goldpricetodays/shared";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { CityPicker } from "@/components/city-picker";
import { PriceChart, type ChartRange } from "@/components/price-chart";
import { Card, Screen } from "@/components/screen";
import { useMarket } from "@/context/market";
import { KARAT_LABEL, placeName, selectionKey, unitPrice, type Karat, type WeightUnit } from "@/lib/quote";

const KARATS: Karat[] = ["k24", "k22", "k21", "k18"];

export default function HomeScreen() {
  const market = useMarket();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [unit, setUnit] = useState<WeightUnit>("gram");
  const [range, setRange] = useState<ChartRange>("7d");
  const rate = market.selectedRate;
  const samples = rate ? (market.samples[selectionKey({ countrySlug: rate.country.slug, citySlug: rate.city?.slug ?? null })] ?? []) : [];

  return (
    <Screen onRefresh={() => void market.refresh()} refreshing={market.refreshing}>
      <Text className="text-xs font-semibold uppercase tracking-[2px] text-gold">goldpricetodays.com</Text>
      <Text className="text-3xl font-semibold text-ink">Gold Price Today</Text>
      <Pressable onPress={() => setPickerOpen(true)} className="rounded-2xl border border-line bg-card px-4 py-3">
        <Text className="text-xs uppercase tracking-wide text-muted">City</Text>
        <Text className="mt-1 text-base font-semibold text-ink">{rate ? placeName(rate) : "Choose a city"}</Text>
      </Pressable>

      {market.loading ? <ActivityIndicator color="#D97706" /> : null}
      {market.error ? (
        <Card>
          <Text className="text-sm leading-5 text-ink">
            {market.fromCache && market.rates.length > 0
              ? `Showing the last saved rates. ${market.error}`
              : market.error}
          </Text>
        </Card>
      ) : null}

      <View className="flex-row gap-2">
        <UnitButton label="Gram" selected={unit === "gram"} onPress={() => setUnit("gram")} />
        <UnitButton label="Tola" selected={unit === "tola"} onPress={() => setUnit("tola")} />
      </View>

      {rate ? (
        <>
          <View className="flex-row flex-wrap gap-3">
            {KARATS.map((karat) => (
              <PriceCard key={karat} karat={karat} amount={unitPrice(rate, karat, unit)} rate={rate} />
            ))}
          </View>
          <Text className="text-sm text-muted">
            Last updated {new Date(rate.updatedAt).toLocaleString(undefined, { hour12: false })}
          </Text>
          <Card>
            <Text className="mb-3 text-base font-semibold text-ink">
              {KARAT_LABEL.k24} {unit === "gram" ? "per gram" : "per tola"}
            </Text>
            <PriceChart
              samples={samples}
              range={range}
              onRange={setRange}
              value={(sample) => (unit === "tola" ? sample.k24 * TOLA_GRAMS : sample.k24)}
            />
          </Card>
        </>
      ) : !market.loading ? (
        <Card>
          <Text className="text-sm leading-5 text-muted">
            Open the city picker after rates load. Saved prices appear here on the next launch even when the network is down.
          </Text>
        </Card>
      ) : null}

      <CityPicker
        visible={pickerOpen}
        rates={market.rates}
        onClose={() => setPickerOpen(false)}
        onSelect={(selection) => void market.choose(selection)}
      />
    </Screen>
  );
}

function UnitButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`rounded-full px-4 py-2 ${selected ? "bg-gold" : "bg-card border border-line"}`}>
      <Text className={`text-sm font-semibold ${selected ? "text-white" : "text-ink"}`}>{label}</Text>
    </Pressable>
  );
}

function PriceCard({
  karat,
  amount,
  rate,
}: {
  karat: Karat;
  amount: number;
  rate: NonNullable<ReturnType<typeof useMarket>["selectedRate"]>;
}) {
  const change = rate.change24hPercent;
  const changeClass = change > 0 ? "text-up" : change < 0 ? "text-down" : "text-muted";
  return (
    <View className="min-w-[46%] flex-1 rounded-2xl border border-line bg-card p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold uppercase tracking-wide text-muted">{KARAT_LABEL[karat]}</Text>
        <Text className={`text-xs font-semibold ${changeClass}`}>{formatSignedPercent(change)} 24h</Text>
      </View>
      <Text className="mt-2 text-xl font-semibold text-ink" style={{ fontVariant: ["tabular-nums"] }}>
        {formatCurrency(amount, rate.country.currencyCode, rate.country.currencySymbol)}
      </Text>
    </View>
  );
}
