import jwt from "jsonwebtoken";

export type AccessTokenPayload = {
  sub: string;
  role: "SUCHENDE" | "BETREIBER" | "ADMIN";
};

// Silent refresh-on-expiry isn't wired up yet, so the access token itself
// carries the session for now; the (separately issued, unused-for-now)
// refresh token is in place for when that lands.
const ACCESS_TOKEN_TTL = "7d";
const REFRESH_TOKEN_TTL = "30d";
const EMAIL_VERIFICATION_TOKEN_TTL = "1d";

type SecretName =
  | "JWT_ACCESS_SECRET"
  | "JWT_REFRESH_SECRET"
  | "JWT_EMAIL_VERIFICATION_SECRET";

function requireSecret(name: SecretName): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name}`);
  }
  return value;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, requireSecret("JWT_ACCESS_SECRET"), {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

export function signRefreshToken(payload: { sub: string }): string {
  return jwt.sign(payload, requireSecret("JWT_REFRESH_SECRET"), {
    expiresIn: REFRESH_TOKEN_TTL,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.verify(token, requireSecret("JWT_ACCESS_SECRET")) as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { sub: string } | null {
  try {
    return jwt.verify(token, requireSecret("JWT_REFRESH_SECRET")) as { sub: string };
  } catch {
    return null;
  }
}

// Stateless by design: verifying twice is harmless (it just re-sets
// emailVerifiedAt), so no server-side "used" tracking is needed for a
// low-stakes confirmation link like this.
export function signEmailVerificationToken(payload: { sub: string }): string {
  return jwt.sign(payload, requireSecret("JWT_EMAIL_VERIFICATION_SECRET"), {
    expiresIn: EMAIL_VERIFICATION_TOKEN_TTL,
  });
}

export function verifyEmailVerificationToken(token: string): { sub: string } | null {
  try {
    return jwt.verify(token, requireSecret("JWT_EMAIL_VERIFICATION_SECRET")) as {
      sub: string;
    };
  } catch {
    return null;
  }
}
