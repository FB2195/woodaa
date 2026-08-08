import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";
import { AuthProvider } from "@/lib/AuthContext";
import { trpc } from "@/lib/trpc";
import { createMobileTrpcLinks } from "@/lib/trpcClient";
import "../global.css";

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => trpc.createClient({ links: createMobileTrpcLinks() }));

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: "#3E4A2B" },
              headerTintColor: "#FFFFFF",
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ title: "Anmelden", presentation: "modal" }} />
            <Stack.Screen
              name="registrieren"
              options={{ title: "Konto erstellen", presentation: "modal" }}
            />
          </Stack>
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
