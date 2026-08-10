import { router, Tabs } from "expo-router";
import { useColorScheme } from "nativewind";
import { Image, Pressable, Text, View } from "react-native";
import woodaaLogo from "../../assets/splash-icon.png";

function TabIcon({ symbol, focused }: { symbol: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{symbol}</Text>;
}

// Booking.com-artige Kopfzeile für die Suche/Startseite: mittiges
// Wordmark-Logo statt Text-Titel, rechts Platzhalter für Nachrichten
// (Chat mit Einrichtungen, künftig auch mit Krankenkassen) und
// Benachrichtigungen (z. B. Buchungsstatus, freie Plätze) - beide Features
// gibt es serverseitig noch nicht, die Icons führen vorerst zu einem
// "Kommt bald"-Screen.
function SearchHeaderTitle() {
  return <Image source={woodaaLogo} style={{ width: 84, height: 44 }} resizeMode="contain" />;
}

function SearchHeaderRight() {
  return (
    <View style={{ flexDirection: "row", gap: 16, paddingRight: 16 }}>
      <Pressable onPress={() => router.push("/nachrichten")} hitSlop={8}>
        <Text style={{ fontSize: 20 }}>💬</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/benachrichtigungen")} hitSlop={8}>
        <Text style={{ fontSize: 20 }}>🔔</Text>
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#3E4A2B" },
        headerTintColor: "#FFFFFF",
        headerTitleAlign: "center",
        tabBarActiveTintColor: "#2F7D4F",
        tabBarInactiveTintColor: isDark ? "#B7C2A8" : "#6B6F62",
        tabBarStyle: {
          backgroundColor: isDark ? "#223018" : "#FFFFFF",
          borderTopColor: isDark ? "#37472A" : "#E4E2D8",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: SearchHeaderTitle,
          headerRight: SearchHeaderRight,
          tabBarLabel: "Suche",
          tabBarIcon: ({ focused }) => <TabIcon symbol="🔍" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="buchungen"
        options={{
          title: "Meine Buchungen",
          tabBarLabel: "Buchungen",
          tabBarIcon: ({ focused }) => <TabIcon symbol="📅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="konto"
        options={{
          title: "Konto",
          tabBarLabel: "Konto",
          tabBarIcon: ({ focused }) => <TabIcon symbol="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
