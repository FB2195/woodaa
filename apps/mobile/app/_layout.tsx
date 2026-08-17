import { StripeProvider } from "@stripe/stripe-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { AppSplashOverlay } from "@/components/AppSplashOverlay";
import { PushNotificationRegistrar } from "@/components/PushNotificationRegistrar";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { stripePublishableKey } from "@/lib/stripeConfig";
import { loadInitialTheme } from "@/lib/themeStore";
import { trpc } from "@/lib/trpc";
import { createMobileTrpcLinks } from "@/lib/trpcClient";
import "../global.css";

// Minimum time the JS-rendered splash (AppSplashOverlay, same look as the
// native one) stays up, so the logo doesn't just flash by on fast devices.
// This is deliberately a plain timer + state gate instead of the
// expo-splash-screen package's preventAutoHideAsync/hideAsync JS API - that
// package pulls in a native module that crashed on startup here (see the
// "Fix Absturz durch falsches Splash-Screen-Setup" commit), so app startup
// stays native-module-free.
const MIN_SPLASH_MS = 900;

function AppGate({
  themeReady,
  children,
}: {
  themeReady: boolean;
  children: React.ReactNode;
}) {
  const { isLoading: authLoading } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  if (authLoading || !themeReady || !minTimeElapsed) {
    return <AppSplashOverlay />;
  }
  return (
    <>
      {children}
      {/* Only mounts once the splash gate has passed - registering for
          push notifications is native-module work, kept away from the
          fragile cold-start path (see MIN_SPLASH_MS comment above). */}
      <PushNotificationRegistrar />
    </>
  );
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
          <AppGate themeReady={themeReady}>
            {/* Falls kein Key gesetzt ist, bleibt die Provider-Instanz
                funktionslos - BookingScreen blendet Karte/Klarna/PayPal dann
                aus (siehe stripeConfig.ts), Rechnung/Kostenübernahme
                funktionieren unabhängig davon. */}
            <StripeProvider publishableKey={stripePublishableKey() ?? ""}>
              <Stack
                screenOptions={{
                  headerStyle: { backgroundColor: "#3E4A2B" },
                  headerTintColor: "#FFFFFF",
                  // headerBackTitle: "" alone does NOT hide the back button
                  // label on @react-navigation/native-stack v6 (bundled with
                  // Expo SDK 51) - it still falls back to the previous
                  // screen's title (here, the "(tabs)" route's literal
                  // folder name, since that screen has headerShown: false
                  // but no `title`). headerBackTitleVisible: false is the
                  // documented v6 way to hide the label entirely.
                  headerBackTitleVisible: false,
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="login"
                  options={{ title: "Anmelden", presentation: "modal" }}
                />
                <Stack.Screen
                  name="registrieren"
                  options={{ title: "Konto erstellen", presentation: "modal" }}
                />
              </Stack>
            </StripeProvider>
          </AppGate>
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
