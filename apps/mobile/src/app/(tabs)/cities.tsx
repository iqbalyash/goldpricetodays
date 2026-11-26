import { formatCurrency, type GoldRate } from "@goldpricetodays/shared";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Card, Screen } from "@/components/screen";
import { useMarket } from "@/context/market";
import { placeName, unitPrice } from "@/lib/quote";

export default function CitiesScreen() {
  const market = useMarket();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();

  const groups = useMemo(() => {
    const countries = Array.from(new Map(market.rates.map((rate) => [rate.country.slug, rate.country])).values());
    return countries
      .map((country) => ({
        country,
        rates: market.rates.filter((rate) => {
          if (rate.country.slug !== country.slug) return false;
          if (!needle) return true;
          const haystack = `${country.name} ${rate.city?.name ?? "average"} ${country.currencyCode}`.toLowerCase();
          return haystack.includes(needle);
        }),
      }))
      .filter((group) => group.rates.length > 0);
  }, [market.rates, needle]);

  return (
    <Screen onRefresh={() => void market.refresh()} refreshing={market.refreshing}>
      <Text className="text-3xl font-semibold text-ink">Cities</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search country or city"
        placeholderTextColor="#64748b"
        autoCapitalize="none"
        className="rounded-2xl border border-line bg-card px-4 py-3 text-base text-ink"
      />
      {market.error && market.rates.length === 0 ? (
        <Card>
          <Text className="text-sm leading-5 text-ink">{market.error}</Text>
        </Card>
      ) : null}
      {groups.map((group) => (
        <View key={group.country.slug} className="gap-2">
          <Text className="text-xs font-semibold uppercase tracking-wide text-muted">{group.country.name}</Text>
          {group.rates.map((rate) => (
            <CityRow
              key={`${rate.country.slug}:${rate.city?.slug ?? "average"}`}
              rate={rate}
              selected={
                market.selection?.countrySlug === rate.country.slug &&
                (market.selection.citySlug ?? null) === (rate.city?.slug ?? null)
              }
              onPress={() => {
                void market.choose({ countrySlug: rate.country.slug, citySlug: rate.city?.slug ?? null });
                router.navigate("/");
              }}
            />
          ))}
        </View>
      ))}
      {!market.loading && groups.length === 0 ? (
        <Text className="text-sm text-muted">No cities match that search.</Text>
      ) : null}
    </Screen>
  );
}

function CityRow({ rate, selected, onPress }: { rate: GoldRate; selected: boolean; onPress: () => void }) {
  const money = (amount: number) => formatCurrency(amount, rate.country.currencyCode, rate.country.currencySymbol);
  return (
    <Pressable onPress={onPress} className={`rounded-2xl border bg-card p-4 ${selected ? "border-gold" : "border-line"}`}>
      <Text className="text-base font-semibold text-ink">{placeName(rate)}</Text>
      <Text className="mt-1 text-sm text-muted" style={{ fontVariant: ["tabular-nums"] }}>
        24K {money(unitPrice(rate, "k24", "gram"))}/g · 22K {money(unitPrice(rate, "k22", "gram"))}/g
      </Text>
      {rate.city ? <Text className="mt-1 text-xs text-muted">{rate.city.marketTimings}</Text> : null}
    </Pressable>
  );
}
