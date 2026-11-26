import type { MetadataRoute } from "next";
import { listPublicUrls } from "@/lib/market-pages";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls = await listPublicUrls();
  return urls.map((entry) => ({
    url: `https://goldpricetodays.com${entry.path === "/" ? "/" : entry.path}`,
    lastModified: entry.lastModified ? new Date(entry.lastModified) : undefined,
    changeFrequency: "hourly",
    priority: entry.path === "/" ? 1 : entry.path.split("/").length > 3 ? 0.7 : 0.8,
  }));
}
