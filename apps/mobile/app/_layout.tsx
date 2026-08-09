import { StripeProvider } from "@stripe/stripe-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { stripePublishableKey } from "@/lib/stripeConfig";
import { loadInitialTheme } from "@/lib/themeStore";
import { trpc } from "@/lib/trpc";
import { createMobileTrpcLinks } from "@/lib/trpcClient";
import "../global.css";

// Keeps the native splash screen (app.json's expo-splash-screen plugin,
// the woodaa logo) up until both the persisted theme preference and the
// stored auth session have loaded - otherwise it hides itself as soon as
// the first frame renders, which can be before either of those async
// reads finish, showing a flash of the wrong theme or a logged-out state
// that immediately flips to logged-in a moment later.
SplashScreen.preventAutoHideAsync().catch(() => {});

function HideSplashWhenReady({ themeReady }: { themeReady: boolean }) {
  const { isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (themeReady && !authLoading) {
      SplashScreen.hideAsync();
    }
  }, [themeReady, authLoading]);

  return null;
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => trpc.createClient({ links: createMobileTrpcLinks() }));
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    loadInitialTheme().finally(() => setThemeReady(true));
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <HideSplashWhenReady themeReady={themeReady} />
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
