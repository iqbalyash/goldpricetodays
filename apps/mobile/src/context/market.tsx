import type { GoldRate } from "@goldpricetodays/shared";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { evaluateAlerts } from "@/lib/alerts";
import { fetchRates } from "@/lib/api";
import { defaultSelection, findRate, type Selection } from "@/lib/quote";
import {
  readAlerts,
  readCachedRates,
  readSamples,
  readSelection,
  recordSamples,
  writeAlerts,
  writeCachedRates,
  writeSelection,
  type PriceAlert,
  type PriceSample,
} from "@/lib/storage";

interface MarketState {
  rates: GoldRate[];
  samples: Record<string, PriceSample[]>;
  alerts: PriceAlert[];
  selection: Selection | null;
  selectedRate: GoldRate | null;
  loading: boolean;
  refreshing: boolean;
  fromCache: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  choose: (selection: Selection) => Promise<void>;
  saveAlert: (alert: PriceAlert) => Promise<void>;
  removeAlert: (id: string) => Promise<void>;
  rearmAlert: (id: string) => Promise<void>;
}

const MarketContext = createContext<MarketState | null>(null);

export function MarketProvider({ children }: { children: ReactNode }) {
  const [rates, setRates] = useState<GoldRate[]>([]);
  const [samples, setSamples] = useState<Record<string, PriceSample[]>>({});
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const next = await fetchRates();
      setRates(next);
      setFromCache(false);
      setError(null);
      await writeCachedRates(next);
      setSamples(await recordSamples(next));
      setSelection((current) => current ?? defaultSelection(next));
      setAlerts(await evaluateAlerts(next));
    } catch (caught) {
      setFromCache(true);
      setError(readableError(caught));
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      const [cached, savedSelection, savedSamples, savedAlerts] = await Promise.all([
        readCachedRates(),
        readSelection(),
        readSamples(),
        readAlerts(),
      ]);
      if (!active) return;
      if (cached?.length) {
        setRates(cached);
        setLoading(false);
      }
      setSelection(savedSelection ?? (cached?.length ? defaultSelection(cached) : null));
      setSamples(savedSamples);
      setAlerts(savedAlerts);
      setFromCache(Boolean(cached?.length));
      await refresh();
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  const choose = useCallback(async (next: Selection) => {
    setSelection(next);
    await writeSelection(next);
  }, []);

  const saveAlert = useCallback(async (alert: PriceAlert) => {
    const next = [alert, ...alerts.filter((item) => item.id !== alert.id)];
    setAlerts(next);
    await writeAlerts(next);
    if (rates.length > 0) setAlerts(await evaluateAlerts(rates));
  }, [alerts, rates]);

  const removeAlert = useCallback(async (id: string) => {
    const next = alerts.filter((alert) => alert.id !== id);
    setAlerts(next);
    await writeAlerts(next);
  }, [alerts]);

  const rearmAlert = useCallback(async (id: string) => {
    const next = alerts.map((alert) => (alert.id === id ? { ...alert, triggeredAt: null } : alert));
    setAlerts(next);
    await writeAlerts(next);
  }, [alerts]);

  const selectedRate = useMemo(() => findRate(rates, selection), [rates, selection]);

  const value = useMemo(
    () => ({
      rates,
      samples,
      alerts,
      selection,
      selectedRate,
      loading,
      refreshing,
      fromCache,
      error,
      refresh,
      choose,
      saveAlert,
      removeAlert,
      rearmAlert,
    }),
    [
      alerts,
      choose,
      error,
      fromCache,
      loading,
      rates,
      rearmAlert,
      refresh,
      refreshing,
      removeAlert,
      samples,
      saveAlert,
      selectedRate,
      selection,
    ],
  );

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

function readableError(caught: unknown): string {
  if (caught instanceof Error) {
    if (caught.message === "Failed to fetch" || caught.message === "Network request failed") {
      return "The rates service could not be reached. Saved prices stay on this phone.";
    }
    return caught.message;
  }
  return "Could not load rates.";
}

export function useMarket(): MarketState {
  const value = useContext(MarketContext);
  if (!value) throw new Error("useMarket must be used inside MarketProvider");
  return value;
}
