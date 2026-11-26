import { revalidatePath, revalidateTag } from "next/cache";
import { connection } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { PriceFeedError, updateGoldPrices } from "@/lib/update-prices";

async function handle(request: Request) {
  await connection();

  if (!isCronAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await updateGoldPrices();

    for (const path of result.paths) {
      revalidatePath(path);
    }
    revalidateTag("gold-rates", { expire: 0 });

    return Response.json({
      ok: true,
      spotUsdPerOunce: result.spotUsdPerOunce,
      spotUpdatedAt: result.spotUpdatedAt,
      quotesWritten: result.quotesWritten,
      skipped: result.skipped,
      revalidatedPaths: result.paths,
    });
  } catch (error) {
    if (error instanceof PriceFeedError) {
      return Response.json({ error: error.message }, { status: 502 });
    }
    console.error(error);
    return Response.json({ error: "Price update failed." }, { status: 500 });
  }
}

export function GET(request: Request) {
  return handle(request);
}

export function POST(request: Request) {
  return handle(request);
}
