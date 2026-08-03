import { createHash } from "node:crypto";

// Fast deterministic hash, not bcrypt: refresh tokens and recovery codes are
// high-entropy random bearer credentials (unlike passwords), so there's no
// offline-brute-force risk to defend against — this only needs to keep a raw
// DB leak (backup, replica, log line) from being directly reusable.
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
