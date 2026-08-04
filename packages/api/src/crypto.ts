import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Generic AES-256-GCM encrypt/decrypt for anything that needs the
// plaintext back (not just a hash) - originally written for TOTP secrets,
// reused for other at-rest secrets (e.g. Versicherungsnummer) that share
// the same threat model: a DB-only leak shouldn't be enough to recover
// them without also compromising the app server's env vars.
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
    throw new Error("Malformed encrypted secret");
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
