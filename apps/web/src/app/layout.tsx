import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://goldpricetodays.com"),
  title: {
    default: "Today's Live Gold Price Worldwide & By City",
    template: "%s · Gold Price Today",
  },
  description:
    "Server-rendered 24K, 22K, 21K, and 18K gold prices in USD and local currency for Pakistan, India, the UAE, Saudi Arabia, the USA, and the UK.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#07090E] font-sans text-[#F8FAFC]">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07090E]/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5">
            <Link href="/" className="min-w-0">
              <span className="block text-[0.68rem] font-semibold tracking-[0.18em] text-[#F59E0B] uppercase">
                goldpricetodays.com
              </span>
              <span className="font-display text-lg font-semibold tracking-tight text-[#F8FAFC]">Gold Price Today</span>
            </Link>
            <p className="hidden text-right text-xs leading-5 text-[#94A3B8] sm:block">
              Indicative bullion rates
              <br />
              Duty, tax, then city premium
            </p>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-white/10 bg-[#07090E]/80">
          <div className="mx-auto max-w-6xl px-5 py-6 text-xs leading-5 text-[#94A3B8]">
            Indicative prices, not a dealer quote. 22K, 21K, and 18K are 22/24, 21/24, and 18/24 of fine gold. One
            troy ounce is 31.1034768 g. One tola is 11.6638 g.
          </div>
        </footer>
      </body>
    </html>
  );
}
