import { cacheLife, cacheTag } from "next/cache";
import { loadMarketCatalog, unconfiguredCatalog, type MarketCatalog } from "@/lib/catalog";

export async function getMarketCatalog(): Promise<MarketCatalog> {
  if (!process.env.DATABASE_URL) {
    return unconfiguredCatalog();
  }
  return readCachedCatalog();
}

async function readCachedCatalog(): Promise<MarketCatalog> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 3600, expire: 86400 });
  cacheTag("gold-rates");
  return loadMarketCatalog();
}
