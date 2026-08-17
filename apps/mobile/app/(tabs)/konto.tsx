import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import {
  BellIcon,
  CalculatorIcon,
  CalendarIcon,
  ChevronRightIcon,
  DownloadIcon,
  HeartPulseIcon,
  HelpCircleIcon,
  LockIcon,
  MessageIcon,
  PersonIcon,
  ShieldIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/account/icons";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/lib/AuthContext";
import { useTranslations } from "@/lib/i18n/LocaleContext";
import { setTheme } from "@/lib/themeStore";
import { trpc } from "@/lib/trpc";

const roleLabels = {
  SUCHENDE: "Suchende:r",
  BETREIBER: "Betreiber:in",
  ADMIN: "Admin",
} as const;

type MenuItem = { href: Parameters<typeof router.push>[0]; label: string; icon: ReactNode };

// Mobile port of apps/web/components/account/AccountMenu.tsx - gleiche
// Gruppierung, Label und Reihenfolge, damit sich "Mein Konto" auf App und
// Web identisch anfühlt. "Favoriten" ist ein Mobile-Zusatz (auf Web über den
// Header erreichbar, hier gibt es keinen persistenten Header-Link dafür).
function MenuRow({ href, label, icon }: MenuItem) {
  return (
    <Pressable
      onPress={() => router.push(href)}
      className="flex-row items-center justify-between gap-3 border-b border-brand-border px-4 py-4 last:border-b-0 dark:border-brand-border-dark"
    >
      <View className="flex-1 flex-row items-center gap-3">
        {icon}
        <Text className="text-sm font-medium text-brand-text dark:text-brand-text-dark">
          {label}
        </Text>
      </View>
      <ChevronRightIcon />
    </Pressable>
  );
}

function MenuSection({ title, items }: { title: string; items: MenuItem[] }) {
  if (items.length === 0) return null;
  return (
    <View className="mt-6">
      <Text className="mb-2 text-sm font-semibold text-brand-text-muted dark:text-brand-text-muted-dark">
        {title}
      </Text>
      <View className="overflow-hidden rounded-brand-lg border border-brand-border bg-brand-surface dark:border-brand-border-dark dark:bg-brand-surface-dark">
        {items.map((item) => (
          <MenuRow key={item.href as string} {...item} />
        ))}
      </View>
    </View>
  );
}

export default function AccountScreen() {
  const { user, isLoading, logout } = useAuth();
  const { colorScheme } = useColorScheme();
  const t = useTranslations("account");
  const tHeader = useTranslations("header");
  // emailVerifiedAt isn't part of the AuthContext's minimal user shape (see
  // lib/AuthContext.tsx) - fetched here since only this screen needs it.
  const me = trpc.auth.me.useQuery(undefined, { enabled: !!user });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background dark:bg-brand-background-dark">
        <ActivityIndicator color="#2F7D4F" />
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-brand-background px-6 dark:bg-brand-background-dark">
        <Text className="text-center text-base text-brand-text dark:text-brand-text-dark">
          Melde dich an oder erstelle ein Konto, um woodaa vollständig zu nutzen.
        </Text>
        <View className="w-full gap-3">
          <PrimaryButton label={tHeader("login")} onPress={() => router.push("/login")} />
          <PrimaryButton
            label={tHeader("register")}
            variant="secondary"
            onPress={() => router.push("/registrieren")}
          />
        </View>
        <ThemeToggle colorScheme={colorScheme} />
      </View>
    );
  }

  const kontoItems: MenuItem[] = [
    { href: "/konto/favoriten", label: tHeader("favorites"), icon: <HeartPulseIcon /> },
    { href: "/konto/persoenliche-angaben", label: t("personalData"), icon: <PersonIcon /> },
    ...(user.role !== "ADMIN"
      ? [
          {
            href: "/konto/sicherheit" as const,
            label: t("securitySettings"),
            icon: <LockIcon />,
          },
        ]
      : []),
    ...(user.role === "SUCHENDE"
      ? [
          {
            href: "/konto/benachrichtigungen" as const,
            label: t("notifications"),
            icon: <BellIcon />,
          },
        ]
      : []),
    ...(user.role !== "ADMIN"
      ? [{ href: "/konto/konto-loeschen" as const, label: t("deleteAccount"), icon: <TrashIcon /> }]
      : []),
  ];

  const buchungenItems: MenuItem[] =
    user.role === "SUCHENDE"
      ? [
          { href: "/(tabs)/buchungen", label: t("myBookings"), icon: <CalendarIcon /> },
          { href: "/konto/nachrichten", label: t("messages"), icon: <MessageIcon /> },
          {
            href: "/konto/pflegeleistungen",
            label: t("requestCareBenefits"),
            icon: <HeartPulseIcon />,
          },
          {
            href: "/konto/pflegeleistungen-berechnen",
            label: tHeader("calculateCareBenefits"),
            icon: <CalculatorIcon />,
          },
          {
            href: "/konto/bevollmaechtigung",
            label: t("authorizedRepresentative"),
            icon: <UsersIcon />,
          },
          {
            href: "/konto/gespeicherte-suchen",
            label: t("savedSearches"),
            icon: <BellIcon />,
          },
        ]
      : [];

  const hilfeItems: MenuItem[] = [
    { href: "/konto/kundenservice", label: tHeader("customerService"), icon: <HelpCircleIcon /> },
    { href: "/konto/hilfe", label: t("helpFaq"), icon: <HelpCircleIcon /> },
    { href: "/konto/fehler-melden", label: tHeader("reportIssue"), icon: <HelpCircleIcon /> },
  ];

  const rechtlichesItems: MenuItem[] = [
    { href: "/konto/daten", label: t("exportData"), icon: <DownloadIcon /> },
    { href: "/konto/datenschutz", label: tHeader("privacy"), icon: <ShieldIcon /> },
    { href: "/konto/nutzungsbedingungen", label: t("termsOfService"), icon: <ShieldIcon /> },
    { href: "/konto/impressum", label: tHeader("imprint"), icon: <ShieldIcon /> },
  ];

  return (
    <ScrollView
      className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      contentContainerClassName="gap-4 px-6 py-8"
    >
      <View className="rounded-brand-lg border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark">
        <Text className="text-lg font-semibold text-brand-primary-dark">{user.name}</Text>
        <Text className="mt-1 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
          {user.email}
        </Text>
        {user.role !== "SUCHENDE" && (
          <Text className="mt-1 text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
            {roleLabels[user.role]}
          </Text>
        )}
        {me.data && !me.data.emailVerifiedAt && (
          <Text className="mt-2 text-xs text-red-600">E-Mail-Adresse noch nicht bestätigt.</Text>
        )}
      </View>

      <MenuSection title={t("manageAccount")} items={kontoItems} />
      <MenuSection title={t("bookingsAndCare")} items={buchungenItems} />
      <MenuSection title={t("help")} items={hilfeItems} />
      <MenuSection title={t("legalAndPrivacy")} items={rechtlichesItems} />

      <View className="mt-2 overflow-hidden rounded-brand-lg border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark">
        <LanguageSwitcher />
      </View>

      <View className="mt-2">
        <ThemeToggle colorScheme={colorScheme} />
      </View>

      <PrimaryButton label={t("logout")} variant="secondary" onPress={() => logout()} />
    </ScrollView>
  );
}

function ThemeToggle({ colorScheme }: { colorScheme: "light" | "dark" | undefined }) {
  const t = useTranslations("theme");
  const options = [
    { value: "light" as const, label: t("light") },
    { value: "dark" as const, label: t("dark") },
  ];

  return (
    <View className="overflow-hidden rounded-brand-lg border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark">
      <Text className="mb-2 text-sm font-medium text-brand-text dark:text-brand-text-dark">
        {t("label")}
      </Text>
      <View className="flex-row gap-2">
        {options.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setTheme(option.value)}
            className={`flex-1 items-center rounded-brand-md border px-3 py-2 ${
              colorScheme === option.value
                ? "border-brand-accent bg-brand-accent"
                : "border-brand-border dark:border-brand-border-dark"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                colorScheme === option.value
                  ? "text-white"
                  : "text-brand-text dark:text-brand-text-dark"
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
