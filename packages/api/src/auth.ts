import jwt from "jsonwebtoken";

export type AccessTokenPayload = {
  sub: string;
  role: "SUCHENDE" | "BETREIBER" | "ADMIN";
};

export type RefreshTokenPayload = {
  sub: string;
  jti: string;
};

// Short-lived on purpose: the refresh flow (packages/api/src/routers/auth.ts
// `refresh`) is DB-backed and rotates on every use, so a leaked access token
// only has a narrow window of usefulness. Cookie maxAge on the web app must
// stay in sync — see ACCESS_TOKEN_TTL_SECONDS below.
const ACCESS_TOKEN_TTL = "20m";
export const ACCESS_TOKEN_TTL_SECONDS = 20 * 60;
const REFRESH_TOKEN_TTL = "30d";
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
const EMAIL_VERIFICATION_TOKEN_TTL = "1d";
const TWO_FACTOR_CHALLENGE_TOKEN_TTL = "5m";
// Shorter than email verification - a leaked/replayed reset link risks a
// full account takeover, not just a harmless re-confirmation.
const PASSWORD_RESET_TOKEN_TTL = "1h";
// Same reasoning as password reset - a leaked link risks hijacking where
// account notifications/logins go.
const EMAIL_CHANGE_TOKEN_TTL = "1h";

type SecretName =
  | "JWT_ACCESS_SECRET"
  | "JWT_REFRESH_SECRET"
  | "JWT_EMAIL_VERIFICATION_SECRET"
  | "JWT_TWO_FACTOR_SECRET"
  | "JWT_PASSWORD_RESET_SECRET"
  | "JWT_EMAIL_CHANGE_SECRET";

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

export function signRefreshToken(payload: RefreshTokenPayload): string {
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

export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    return jwt.verify(token, requireSecret("JWT_REFRESH_SECRET")) as RefreshTokenPayload;
  } catch {
    return null;
  }
}

// Short-lived token identifying "this user passed step 1 (password) of an
// admin login and now owes a TOTP code" — kept on its own secret so a leak
// of any other token class can't be used to forge a 2FA challenge.
export function signTwoFactorChallengeToken(payload: { sub: string }): string {
  return jwt.sign(payload, requireSecret("JWT_TWO_FACTOR_SECRET"), {
    expiresIn: TWO_FACTOR_CHALLENGE_TOKEN_TTL,
  });
}

export function verifyTwoFactorChallengeToken(token: string): { sub: string } | null {
  try {
    return jwt.verify(token, requireSecret("JWT_TWO_FACTOR_SECRET")) as { sub: string };
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

// Hybrid, unlike the email-verification token above: this JWT is ALSO
// hashed and stored as a PasswordResetToken row (see routers/auth.ts), so
// the link is genuinely single-use and revocable, not just time-limited.
export function signPasswordResetToken(payload: { sub: string; jti: string }): string {
  return jwt.sign(payload, requireSecret("JWT_PASSWORD_RESET_SECRET"), {
    expiresIn: PASSWORD_RESET_TOKEN_TTL,
  });
}

export function verifyPasswordResetToken(
  token: string,
): { sub: string; jti: string } | null {
  try {
    return jwt.verify(token, requireSecret("JWT_PASSWORD_RESET_SECRET")) as {
      sub: string;
      jti: string;
    };
  } catch {
    return null;
  }
}

// Hybrid like password reset: `sub` is the EmailChangeRequest id (not the
// user id), since the same request row carries two separate single-use
// tokens (old-address confirm, then new-address confirm) - see
// requestEmailChange/confirmOldEmailChange/confirmNewEmailChange in
// routers/auth.ts.
export function signEmailChangeToken(payload: { sub: string; jti: string }): string {
  return jwt.sign(payload, requireSecret("JWT_EMAIL_CHANGE_SECRET"), {
    expiresIn: EMAIL_CHANGE_TOKEN_TTL,
  });
}

export function verifyEmailChangeToken(
  token: string,
): { sub: string; jti: string } | null {
  try {
    return jwt.verify(token, requireSecret("JWT_EMAIL_CHANGE_SECRET")) as {
      sub: string;
      jti: string;
    };
  } catch {
    return null;
  }
}
