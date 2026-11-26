"use client";

import { formatCurrency } from "@goldpricetodays/shared";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HistoryPoint } from "@/lib/homepage-data";

export function PriceChart({ points, note }: { points: HistoryPoint[]; note: string | null }) {
  if (points.length === 0) {
    return <p className="max-w-xl text-sm leading-6 text-[#94A3B8]">{note}</p>;
  }

  return (
    <div>
      <p className="text-sm text-[#94A3B8]">Daily average XAU/USD per troy ounce.</p>
      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="goldArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
              <filter id="goldStroke" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#F59E0B" floodOpacity="0.85" />
              </filter>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 12 }} tickMargin={8} minTickGap={24} />
            <YAxis
              tick={{ fill: "#94A3B8", fontSize: 12 }}
              width={72}
              domain={["auto", "auto"]}
              tickFormatter={(value: number) => formatCurrency(value, "USD", "$")}
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value), "USD", "$")}
              labelFormatter={(label) => String(label)}
              contentStyle={{
                background: "#07090E",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                color: "#F8FAFC",
              }}
            />
            <Area
              type="monotone"
              dataKey="usdPerOunce"
              stroke="#F59E0B"
              fill="url(#goldArea)"
              strokeWidth={2}
              filter="url(#goldStroke)"
              name="USD / oz"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>30-day average XAU/USD prices</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>USD per troy ounce</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.date}>
              <td>{point.date}</td>
              <td>{point.usdPerOunce}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {note ? <p className="mt-3 text-sm text-[#94A3B8]">{note}</p> : null}
    </div>
  );
}
