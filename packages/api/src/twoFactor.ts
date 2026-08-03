import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { authenticator } from "otplib";

// TOTP secrets are encrypted at rest (not just hashed, since we need the
// plaintext back to verify codes): a DB-only leak (backup, misconfigured
// replica) shouldn't be enough to defeat 2FA for every admin without also
// compromising the app server's env vars.
function encryptionKey(): Buffer {
  const raw = process.env.TOTP_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("Missing required env var TOTP_ENCRYPTION_KEY");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("TOTP_ENCRYPTION_KEY must decode to exactly 32 bytes (base64)");
  }
  return key;
}

export function encryptSecret(secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, encrypted, authTag].map((buf) => buf.toString("base64")).join(".");
}

export function decryptSecret(stored: string): string {
  const parts = stored.split(".");
  if (parts.length !== 3) {
    throw new Error("Malformed encrypted TOTP secret");
  }
  const [ivB64, encryptedB64, authTagB64] = parts as [string, string, string];
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedB64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function totpKeyUri(email: string, secret: string): string {
  return authenticator.keyuri(email, "Woodaa", secret);
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
