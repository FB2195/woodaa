import type { PrismaClient } from "@prisma/client";

// Sends via Expo's push notification service (https://exp.host) rather than
// talking to APNs/FCM directly - the mobile app already gets its device
// token from expo-notifications in that same Expo-managed format, so this
// is the natural counterpart, and it fans a single request out to both iOS
// and Android without separate credentials for each platform.
//
// Best-effort: a user with no registered device (never opened the app on a
// device with notifications enabled, or web-only) just gets nothing sent,
// same as the email helpers silently no-op when there's no address to use.
// Errors are swallowed rather than thrown - a push failure must never roll
// back or block the booking-confirmation flow that triggers it.
export async function sendPushNotification(
  db: PrismaClient,
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  const tokens = await db.pushToken.findMany({ where: { userId }, select: { token: true } });
  if (tokens.length === 0) return;

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(
        tokens.map(({ token }) => ({ to: token, title, body, data, sound: "default" })),
      ),
    });
  } catch {
    // Network hiccup or Expo's push service being down - not worth
    // surfacing to the booking flow that triggered this.
  }
}
