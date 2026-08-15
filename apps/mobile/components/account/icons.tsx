import { Text } from "react-native";

// RN-Port von apps/web/components/account/icons.tsx - dort sind es
// handgezeichnete SVG-Icons. Um für dieses Menü keine neue native
// Abhängigkeit (react-native-svg o. ä.) einzuführen, sind es hier simple
// Text-Glyphen in derselben Größe/Farbe wie die Web-Icons.
function base(glyph: string) {
  return (
    <Text className="text-base text-brand-text-muted dark:text-brand-text-muted-dark">
      {glyph}
    </Text>
  );
}

export function ChevronRightIcon() {
  return (
    <Text className="text-base text-brand-text-muted dark:text-brand-text-muted-dark">›</Text>
  );
}

export function PersonIcon() {
  return base("👤");
}

export function LockIcon() {
  return base("🔒");
}

export function TrashIcon() {
  return base("🗑");
}

export function CalendarIcon() {
  return base("📅");
}

export function HeartPulseIcon() {
  return base("❤️");
}

export function UsersIcon() {
  return base("👥");
}

export function DownloadIcon() {
  return base("⬇️");
}

export function BellIcon() {
  return base("🔔");
}

export function HelpCircleIcon() {
  return base("❓");
}

export function ShieldIcon() {
  return base("🛡");
}

export function CalculatorIcon() {
  return base("🧮");
}
