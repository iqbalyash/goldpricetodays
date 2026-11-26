import { redirect } from "next/navigation";
import { Suspense } from "react";

export default function Page({ params }: { params: Promise<{ country: string; city: string }> }) {
  return (
    <Suspense>
      <Send params={params} />
    </Suspense>
  );
}

async function Send({ params }: { params: Promise<{ country: string; city: string }> }) {
  const { country, city } = await params;
  redirect(`/gold-price/${country}/${city}`);
  return null;
}
