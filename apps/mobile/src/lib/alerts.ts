import { formatCurrency, type GoldRate } from "@goldpricetodays/shared";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { readAlerts, writeAlerts, type PriceAlert } from "@/lib/storage";
import { gramPrice, rateKey } from "@/lib/quote";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureAlertPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("gold-alerts", {
      name: "Gold price alerts",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export async function evaluateAlerts(rates: GoldRate[]): Promise<PriceAlert[]> {
  const alerts = await readAlerts();
  let changed = false;
  const byKey = new Map(rates.map((rate) => [rateKey(rate), rate]));

  for (const alert of alerts) {
    if (alert.triggeredAt) continue;
    const rate = byKey.get(`${alert.countrySlug}:${alert.citySlug ?? "average"}`);
    if (!rate) continue;
    const price = gramPrice(rate, alert.karat);
    const hit = alert.side === "buy" ? price <= alert.target : price >= alert.target;
    if (!hit) continue;
    alert.triggeredAt = new Date().toISOString();
    changed = true;
    await presentAlert(alert, price);
  }

  if (changed) await writeAlerts(alerts);
  return alerts;
}

async function presentAlert(alert: PriceAlert, price: number): Promise<void> {
  if (Platform.OS === "web") return;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;
  const money = (amount: number) => formatCurrency(amount, alert.currencyCode, alert.currencySymbol);
  const side = alert.side === "buy" ? "at or below" : "at or above";
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${alert.karat === "k24" ? "24K" : "22K"} ${alert.side} alert`,
      body: `${alert.place} is ${money(price)} per gram, ${side} your ${money(alert.target)} target.`,
      sound: true,
    },
    trigger: null,
  });
}
