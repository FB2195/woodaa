import { ScrollView, Text, View } from "react-native";

const bookingTypes = [
  {
    title: "Stationäre Aufnahme",
    description: "Dauerhafter Pflegeplatz für die langfristige Versorgung.",
  },
  {
    title: "Kurzzeitpflege",
    description:
      "Zeitlich befristeter Aufenthalt, z. B. nach einem Krankenhausaufenthalt.",
  },
  {
    title: "Tages- & Nachtpflege",
    description: "Teilstationäre Betreuung ohne durchgängige Übernachtung.",
  },
];

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-brand-background">
      <View className="px-6 py-8">
        <Text className="text-2xl font-bold text-brand-primary-dark">
          Den richtigen Pflegeplatz finden.
        </Text>
        <Text className="mt-2 text-base text-brand-text-muted">
          Woodaa verbindet Familien mit geprüften Pflegeeinrichtungen in ganz
          Deutschland.
        </Text>

        <View className="mt-8 gap-4">
          {bookingTypes.map((type) => (
            <View
              key={type.title}
              className="rounded-brand-lg border border-brand-border bg-brand-surface p-4"
            >
              <Text className="text-base font-semibold text-brand-primary-dark">
                {type.title}
              </Text>
              <Text className="mt-1 text-sm text-brand-text-muted">
                {type.description}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
