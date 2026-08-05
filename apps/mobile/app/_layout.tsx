import { Stack } from "expo-router";
import "../global.css";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#3E4A2B" },
        headerTintColor: "#FFFFFF",
      }}
    >
      <Stack.Screen name="index" options={{ title: "woodaa" }} />
    </Stack>
  );
}
