import { randomBytes } from "node:crypto";
import { authenticator } from "otplib";

// TOTP secrets are encrypted at rest (not just hashed, since we need the
// plaintext back to verify codes): a DB-only leak (backup, misconfigured
// replica) shouldn't be enough to defeat 2FA for every admin without also
// compromising the app server's env vars. The actual AES-256-GCM
// encrypt/decrypt lives in ./crypto (shared with other at-rest secrets,
// e.g. Versicherungsnummer) - re-exported here so existing imports keep
// working.
export { encryptSecret, decryptSecret } from "./crypto";

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function totpKeyUri(email: string, secret: string): string {
  return authenticator.keyuri(email, "woodaa", secret);
}

export function verifyTotpCode(secret: string, code: string): boolean {
  try {
    return authenticator.check(code, secret);
  } catch {
    return false;
  }
}

// Human-typeable one-time recovery codes (e.g. "7K3F-9QXP"), shown once on
// 2FA setup. Returned as plaintext for display; callers hash them via
// hashToken before persisting.
export function generateRecoveryCodes(count = 8): string[] {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity
  return Array.from({ length: count }, () => {
    const bytes = randomBytes(8);
    let code = "";
    for (let i = 0; i < 8; i += 1) {
      const byte = bytes[i] ?? 0;
      code += alphabet[byte % alphabet.length];
      if (i === 3) code += "-";
    }
    return code;
  });
}
