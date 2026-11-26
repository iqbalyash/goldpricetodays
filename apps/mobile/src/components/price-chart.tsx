import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";
import type { PriceSample } from "@/lib/storage";

export type ChartRange = "7d" | "30d" | "1y";

const RANGES: { id: ChartRange; label: string; days: number }[] = [
  { id: "7d", label: "7D", days: 7 },
  { id: "30d", label: "30D", days: 30 },
  { id: "1y", label: "1Y", days: 365 },
];

export function PriceChart({
  samples,
  value,
  range,
  onRange,
}: {
  samples: PriceSample[];
  value: (sample: PriceSample) => number;
  range: ChartRange;
  onRange: (range: ChartRange) => void;
}) {
  const [width, setWidth] = useState(0);
  const days = RANGES.find((item) => item.id === range)?.days ?? 7;
  const points = useMemo(() => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return samples.filter((sample) => Date.parse(sample.at) >= cutoff);
  }, [days, samples]);

  const height = 160;
  const path = useMemo(() => {
    if (width <= 0 || points.length < 2) return "";
    const values = points.map(value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    return points
      .map((sample, index) => {
        const x = (index / (points.length - 1)) * (width - 8) + 4;
        const y = height - 8 - ((value(sample) - min) / span) * (height - 16);
        return `${x},${y}`;
      })
      .join(" ");
  }, [points, value, width]);

  return (
    <View className="gap-3">
      <View className="flex-row gap-2">
        {RANGES.map((item) => {
          const selected = item.id === range;
          return (
            <Pressable
              key={item.id}
              onPress={() => onRange(item.id)}
              className={`rounded-full px-4 py-2 ${selected ? "bg-gold" : "bg-paper"}`}
            >
              <Text className={`text-sm font-semibold ${selected ? "text-white" : "text-ink"}`}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View className="h-40" onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {points.length >= 2 && width > 0 ? (
          <Svg width={width} height={height}>
            <Polyline points={path} fill="none" stroke="#D97706" strokeWidth={2.5} strokeLinejoin="round" />
          </Svg>
        ) : (
          <View className="h-40 items-center justify-center rounded-xl bg-paper px-4">
            {points.length === 1 ? <SinglePoint /> : null}
            <Text className="text-center text-sm leading-5 text-muted">
              {points.length === 0
                ? "No saved prices in this range yet. Pull to refresh. The chart keeps each quote this phone receives and does not estimate missing days."
                : "One saved quote is in this range. Another refresh at least 15 minutes later draws the line."}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function SinglePoint() {
  return (
    <Svg width={24} height={24}>
      <Circle cx={12} cy={12} r={4} fill="#D97706" />
    </Svg>
  );
}
