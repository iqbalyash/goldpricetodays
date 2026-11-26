import { redirect } from "next/navigation";
import { Suspense } from "react";

export default function Page({ params }: { params: Promise<{ country: string }> }) {
  return (
    <Suspense>
      <Send params={params} />
    </Suspense>
  );
}

async function Send({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  redirect(`/gold-price/${country}`);
  return null;
}
