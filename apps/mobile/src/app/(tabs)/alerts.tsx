import { formatCurrency } from "@goldpricetodays/shared";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Card, Screen } from "@/components/screen";
import { useMarket } from "@/context/market";
import { ensureAlertPermission } from "@/lib/alerts";
import { gramPrice, KARAT_LABEL, placeName, type Karat } from "@/lib/quote";
import type { PriceAlert } from "@/lib/storage";

type AlertKarat = Extract<Karat, "k24" | "k22">;

export default function AlertsScreen() {
  const market = useMarket();
  const rate = market.selectedRate;
  const [karat, setKarat] = useState<AlertKarat>("k24");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [target, setTarget] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  async function save() {
    if (!rate) {
      setNotice("Choose a city on Home before saving an alert.");
      return;
    }
    const amount = Number(target);
    if (!Number.isFinite(amount) || amount <= 0) {
      setNotice("Enter a target price per gram.");
      return;
    }
    const allowed = await ensureAlertPermission();
    setNotice(
      allowed
        ? "Alert saved. It fires a local notification the next time rates refresh and the target is met."
        : "Alert saved on this phone. Allow notifications to receive the local alert when the target is met.",
    );
    await market.saveAlert({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      countrySlug: rate.country.slug,
      citySlug: rate.city?.slug ?? null,
      place: placeName(rate),
      currencyCode: rate.country.currencyCode,
      currencySymbol: rate.country.currencySymbol,
      karat,
      side,
      target: amount,
      createdAt: new Date().toISOString(),
      triggeredAt: null,
    });
    setTarget("");
  }

  return (
    <Screen onRefresh={() => void market.refresh()} refreshing={market.refreshing}>
      <Text className="text-3xl font-semibold text-ink">Price alerts</Text>
      <Text className="text-sm leading-5 text-muted">
        Buy alerts fire when the city price is at or below the target. Sell alerts fire at or above it. Checks run when rates refresh.
      </Text>
      <Card>
        <Text className="text-base font-semibold text-ink">{rate ? placeName(rate) : "No city selected"}</Text>
        {rate ? (
          <Text className="mt-1 text-sm text-muted" style={{ fontVariant: ["tabular-nums"] }}>
            {KARAT_LABEL[karat]} now {formatCurrency(gramPrice(rate, karat), rate.country.currencyCode, rate.country.currencySymbol)} / gram
          </Text>
        ) : null}
        <View className="mt-3 flex-row gap-2">
          <Chip label="24K" selected={karat === "k24"} onPress={() => setKarat("k24")} />
          <Chip label="22K" selected={karat === "k22"} onPress={() => setKarat("k22")} />
        </View>
        <View className="mt-2 flex-row gap-2">
          <Chip label="Buy" selected={side === "buy"} onPress={() => setSide("buy")} />
          <Chip label="Sell" selected={side === "sell"} onPress={() => setSide("sell")} />
        </View>
        <TextInput
          value={target}
          onChangeText={setTarget}
          keyboardType="decimal-pad"
          placeholder="Target per gram"
          placeholderTextColor="#64748b"
          className="mt-3 rounded-xl border border-line px-4 py-3 text-base text-ink"
        />
        <Pressable onPress={() => void save()} className="mt-3 items-center rounded-full bg-gold px-4 py-3">
          <Text className="text-base font-semibold text-white">Save alert</Text>
        </Pressable>
        {notice ? <Text className="mt-3 text-sm leading-5 text-muted">{notice}</Text> : null}
      </Card>
      {market.alerts.map((alert) => (
        <AlertRow
          key={alert.id}
          alert={alert}
          onRemove={() => void market.removeAlert(alert.id)}
          onRearm={() => void market.rearmAlert(alert.id)}
        />
      ))}
    </Screen>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`min-h-11 justify-center rounded-full px-4 py-2 ${selected ? "bg-gold" : "border border-line bg-paper"}`}>
      <Text className={`text-sm font-semibold ${selected ? "text-white" : "text-ink"}`}>{label}</Text>
    </Pressable>
  );
}

function AlertRow({ alert, onRemove, onRearm }: { alert: PriceAlert; onRemove: () => void; onRearm: () => void }) {
  const money = formatCurrency(alert.target, alert.currencyCode, alert.currencySymbol);
  return (
    <Card>
      <Text className="text-base font-semibold text-ink">
        {alert.side === "buy" ? "Buy" : "Sell"} {KARAT_LABEL[alert.karat]} · {alert.place}
      </Text>
      <Text className="mt-1 text-sm text-muted" style={{ fontVariant: ["tabular-nums"] }}>
        Target {money} per gram
        {alert.triggeredAt ? ` · triggered ${new Date(alert.triggeredAt).toLocaleString(undefined, { hour12: false })}` : " · watching"}
      </Text>
      <View className="mt-3 flex-row gap-3">
        {alert.triggeredAt ? (
          <Pressable onPress={onRearm} className="rounded-full border border-line px-4 py-2">
            <Text className="text-sm font-semibold text-ink">Arm again</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onRemove} className="rounded-full border border-line px-4 py-2">
          <Text className="text-sm font-semibold text-down">Delete</Text>
        </Pressable>
      </View>
    </Card>
  );
}
