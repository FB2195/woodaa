// Inlined at build time by Expo (EXPO_PUBLIC_ prefix) - see .env.example.
// Falls back to the local API dev server so `pnpm --filter mobile start`
// works against `pnpm --filter api dev` without any extra setup.
export function apiUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";
}
