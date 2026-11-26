import Link from "next/link";

export default function NotFound() {
  return (
    <div className="glass mx-auto mt-10 max-w-xl rounded-3xl px-6 py-10">
      <h1 className="metal-title font-display text-3xl">That market is not listed</h1>
      <p className="mt-2 text-sm text-[#94A3B8]">
        Try Pakistan, India, the UAE, or the United States.
      </p>
      <Link href="/" className="mt-5 inline-block text-sm text-[#FDE68A]">
        Back to today&apos;s prices
      </Link>
    </div>
  );
}
