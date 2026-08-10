import { StripeProvider } from "@stripe/stripe-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { AuthProvider } from "@/lib/AuthContext";
import { stripePublishableKey } from "@/lib/stripeConfig";
import { loadInitialTheme } from "@/lib/themeStore";
import { trpc } from "@/lib/trpc";
import { createMobileTrpcLinks } from "@/lib/trpcClient";
import "../global.css";

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => trpc.createClient({ links: createMobileTrpcLinks() }));

  useEffect(() => {
    loadInitialTheme();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {/* Falls kein Key gesetzt ist, bleibt die Provider-Instanz
              funktionslos - BookingScreen blendet Karte/Klarna/PayPal dann
              aus (siehe stripeConfig.ts), Rechnung/Kostenübernahme
              funktionieren unabhängig davon. */}
          <StripeProvider publishableKey={stripePublishableKey() ?? ""}>
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
          </StripeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
