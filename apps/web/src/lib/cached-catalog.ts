import { loadMarketCatalog, unconfiguredCatalog, type MarketCatalog } from "@/lib/catalog";

export async function getMarketCatalog(): Promise<MarketCatalog> {
  if (!process.env.DATABASE_URL) {
    return unconfiguredCatalog();
  }
  return loadMarketCatalog();
}
