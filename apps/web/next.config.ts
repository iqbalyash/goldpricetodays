import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const appDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  outputFileTracingRoot: path.join(appDir, "../.."),
  transpilePackages: ["@goldpricetodays/shared"],
  async redirects() {
    const countries = "pakistan|india|uae|saudi-arabia|usa|uk";
    return [
      {
        source: `/:country(${countries})`,
        destination: "/gold-price/:country",
        permanent: true,
      },
      {
        source: `/:country(${countries})/:city`,
        destination: "/gold-price/:country/:city",
        permanent: true,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
