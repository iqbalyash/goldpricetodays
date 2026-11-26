"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="glass mx-auto mt-10 max-w-xl rounded-3xl px-6 py-10">
      <h1 className="metal-title font-display text-3xl">Rates could not be loaded</h1>
      <p className="mt-2 text-sm text-[#94A3B8]">The page will try the database again.</p>
      <button
        type="button"
        onClick={reset}
        className="foil mt-5 rounded-full px-4 py-2 text-sm font-semibold"
      >
        Try again
      </button>
    </div>
  );
}
