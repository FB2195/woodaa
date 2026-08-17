import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { registerForPushNotificationsAsync } from "@/lib/pushNotifications";
import { trpc } from "@/lib/trpc";

// Mounted once near the app root (see app/_layout.tsx) - renders nothing,
// just registers the device's Expo push token with the backend once a user
// is logged in, so booking-confirmation pushes (see packages/api/src/push.ts)
// have somewhere to go. Re-runs on every login (not just the first) since
// the token itself doesn't change per-user, but a fresh account on the same
// device needs its own registration row - the backend upserts by token
// value, so registering again for the same token/user pair is a no-op.
export function PushNotificationRegistrar() {
  const { user } = useAuth();
  const registerToken = trpc.pushToken.register.useMutation();
  const registeredForUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user || registeredForUserId.current === user.id) return;
    registeredForUserId.current = user.id;
    void (async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) registerToken.mutate({ token });
    })();
    // registerToken is a stable-enough mutation object (see AuthContext's
    // similar comment) - only user.id should re-trigger this.
  }, [user]);

  return null;
}
