import { connection } from "next/server";
import { listStoredRates, readSlug } from "@/lib/catalog";

export async function GET(request: Request) {
  await connection();

  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "Rates are unavailable." }, { status: 503 });
  }

  const url = new URL(request.url);
  const country = readSlug(url.searchParams.get("country"));
  const city = readSlug(url.searchParams.get("city"));

  if (country === "invalid" || city === "invalid") {
    return Response.json(
      { error: "Country and city filters must be lowercase slugs." },
      { status: 400 },
    );
  }
  if (city && !country) {
    return Response.json(
      { error: "A country slug is required when filtering by city." },
      { status: 400 },
    );
  }

  try {
    const result = await listStoredRates({ countrySlug: country, citySlug: city });
    if (result.status === "not_found") {
      const label = result.which === "country" ? "Country" : "City";
      return Response.json({ error: `${label} not found.` }, { status: 404 });
    }
    return Response.json({ rates: result.rates });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Rates are unavailable." }, { status: 503 });
  }
}
