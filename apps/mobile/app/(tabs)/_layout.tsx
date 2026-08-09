import { Tabs } from "expo-router";
import { useColorScheme } from "nativewind";
import { Text } from "react-native";

function TabIcon({ symbol, focused }: { symbol: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{symbol}</Text>;
}

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#3E4A2B" },
        headerTintColor: "#FFFFFF",
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
          title: "woodaa",
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
