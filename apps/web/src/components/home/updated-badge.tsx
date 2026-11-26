"use client";

import { useEffect, useState } from "react";

export function UpdatedBadge({
  iso,
  source,
}: {
  iso: string;
  source: "database snapshot" | "spot feed";
}) {
  const [local, setLocal] = useState<string | null>(null);
  const utc = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  }).format(new Date(iso));

  useEffect(() => {
    setLocal(
      new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        hour12: false,
      }).format(new Date(iso)),
    );
  }, [iso]);

  return (
    <p className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-[#94A3B8]">
      <span className="font-medium text-[#F8FAFC]">Last updated:</span>
      <time dateTime={iso} className="num text-[#F8FAFC]">
        {utc} UTC
        {local ? ` · ${local} local` : ""}
      </time>
      <span>· {source}</span>
    </p>
  );
}
