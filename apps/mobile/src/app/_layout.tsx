import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MarketProvider } from "@/context/market";

export default function RootLayout() {
  return (
    <MarketProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#f8fafc" },
        }}
      />
    </MarketProvider>
  );
}
