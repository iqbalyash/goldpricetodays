import type { GoldRate } from "@goldpricetodays/shared";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { placeName, type Selection } from "@/lib/quote";

export function CityPicker({
  visible,
  rates,
  onClose,
  onSelect,
}: {
  visible: boolean;
  rates: GoldRate[];
  onClose: () => void;
  onSelect: (selection: Selection) => void;
}) {
  const countries = Array.from(new Map(rates.map((rate) => [rate.country.slug, rate.country])).values());

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[80%] rounded-t-3xl bg-card px-5 pb-8 pt-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-ink">Country and city</Text>
            <Pressable onPress={onClose} className="px-2 py-2">
              <Text className="text-base font-semibold text-gold">Done</Text>
            </Pressable>
          </View>
          <ScrollView>
            {countries.map((country) => {
              const rows = rates.filter((rate) => rate.country.slug === country.slug);
              return (
                <View key={country.slug} className="mb-4">
                  <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{country.name}</Text>
                  {rows.map((rate) => (
                    <Pressable
                      key={`${rate.country.slug}:${rate.city?.slug ?? "average"}`}
                      className="border-t border-line py-3"
                      onPress={() => {
                        onSelect({ countrySlug: rate.country.slug, citySlug: rate.city?.slug ?? null });
                        onClose();
                      }}
                    >
                      <Text className="text-base text-ink">{placeName(rate)}</Text>
                      <Text className="text-sm text-muted">{rate.country.currencyCode}</Text>
                    </Pressable>
                  ))}
                </View>
              );
            })}
            {countries.length === 0 ? (
              <Text className="text-sm leading-5 text-muted">Rates are not on this phone yet.</Text>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
