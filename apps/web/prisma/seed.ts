import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedMarkets } from "../src/lib/markets";

function requireDatabaseUrl(): string {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Set DATABASE_URL or DIRECT_URL before seeding.");
  }
  return connectionString;
}

const connectionString = requireDatabaseUrl();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  for (const market of seedMarkets) {
    const country = await prisma.country.upsert({
      where: { slug: market.slug },
      update: {
        name: market.name,
        currencyCode: market.currencyCode,
        currencySymbol: market.currencySymbol,
        defaultTaxPercent: market.defaultTaxPercent,
        defaultDutyPercent: market.defaultDutyPercent,
        usesTola: market.usesTola,
      },
      create: {
        slug: market.slug,
        name: market.name,
        currencyCode: market.currencyCode,
        currencySymbol: market.currencySymbol,
        defaultTaxPercent: market.defaultTaxPercent,
        defaultDutyPercent: market.defaultDutyPercent,
        usesTola: market.usesTola,
      },
    });

    for (const city of market.cities) {
      await prisma.city.upsert({
        where: {
          countryId_slug: { countryId: country.id, slug: city.slug },
        },
        update: {
          name: city.name,
          localPremiumPercent: city.localPremiumPercent,
          marketTimings: city.marketTimings,
          localDescription: city.localDescription,
        },
        create: {
          countryId: country.id,
          slug: city.slug,
          name: city.name,
          localPremiumPercent: city.localPremiumPercent,
          marketTimings: city.marketTimings,
          localDescription: city.localDescription,
        },
      });
    }

    await prisma.city.deleteMany({
      where: {
        countryId: country.id,
        slug: { notIn: market.cities.map((city) => city.slug) },
      },
    });

    console.log(`Seeded ${market.name} (${market.cities.length} cities).`);
  }

  await refreshLivePrices(connectionString);
}

async function refreshLivePrices(connectionString: string) {
  const secret = process.env.CRON_SECRET;
  const origin = (process.env.SEED_APP_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");

  if (secret) {
    try {
      const response = await fetch(`${origin}/api/cron/update-prices`, {
        method: "POST",
        headers: { authorization: `Bearer ${secret}` },
        signal: AbortSignal.timeout(30_000),
      });
      const body = await response.text();
      if (response.ok) {
        console.log(`Price cron wrote live 24K–18K snapshots: ${body}`);
        return;
      }
      console.error(`Price cron returned ${response.status}: ${body}`);
    } catch (error) {
      console.error("Price cron could not be reached.", error);
    }
  } else {
    console.log("CRON_SECRET is unset, so /api/cron/update-prices was not called.");
  }

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = connectionString;
  }
  const { updateGoldPrices } = await import("../src/lib/update-prices");
  const result = await updateGoldPrices();
  console.log(
    `Wrote ${result.quotesWritten} live 24K, 22K, 21K, and 18K snapshots from the spot feed at ${result.spotUsdPerOunce} USD/oz.`,
  );
  if (result.skipped.length > 0) {
    console.log("Skipped markets:", result.skipped);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
