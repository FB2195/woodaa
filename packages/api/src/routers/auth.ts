import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import {
  BootstrapAdminInput,
  ConfirmEmailChangeInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  RequestEmailChangeInput,
  ResetPasswordInput,
  UpdateNameInput,
} from "@woodaa/validators";
import { z } from "zod";
import {
  signAccessToken,
  signEmailChangeToken,
  signEmailVerificationToken,
  signPasswordResetToken,
  signRefreshToken,
  signTwoFactorChallengeToken,
  verifyEmailChangeToken,
  verifyEmailVerificationToken,
  verifyPasswordResetToken,
  verifyRefreshToken,
  verifyTwoFactorChallengeToken,
} from "../auth";
import { encryptSecret } from "../crypto";
import {
  sendEmailChangeNewAddressEmail,
  sendEmailChangeOldAddressEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../email";
import { createFacilityForOperator } from "../lib/facility";
import { hashToken } from "../tokenHash";
import { decryptSecret, verifyTotpCode } from "../twoFactor";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import type { Context } from "../trpc";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 2 * 60 * 1000;
const PASSWORD_RESET_COOLDOWN_MS = 2 * 60 * 1000;
const PASSWORD_RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;
const EMAIL_CHANGE_COOLDOWN_MS = 2 * 60 * 1000;
const EMAIL_CHANGE_TOKEN_EXPIRY_MS = 60 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const GENERIC_LOGIN_ERROR = "E-Mail oder Passwort ist falsch.";
// A real bcrypt hash of a random value, computed lazily on first use and
// then reused - pads the "no such account" / "account locked" branches to
// roughly the same response time as a real password check, so timing can't
// be used to distinguish them from a wrong-password attempt.
let dummyHash: string | null = null;
async function getDummyHash(): Promise<string> {
  if (!dummyHash) {
    dummyHash = await bcrypt.hash(randomUUID(), 12);
  }
  return dummyHash;
}

type AuthedUser = { id: string; role: "SUCHENDE" | "BETREIBER" | "ADMIN" };

// Persists (and, on rotation, revokes the predecessor of) a refresh token so
// it can later be looked up/revoked from the DB - the JWT signature alone
// only proves authenticity, not that the token hasn't been logged out or
// already rotated away.
async function issueTokens(
  ctx: Context,
  user: AuthedUser,
  rotate?: { oldTokenId: string; familyId: string },
) {
  const familyId = rotate?.familyId ?? randomUUID();
  const refreshToken = signRefreshToken({ sub: user.id, jti: randomUUID() });
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  const created = await ctx.db.refreshToken.create({
    data: { userId: user.id, tokenHash, familyId, expiresAt },
  });
  if (rotate) {
    await ctx.db.refreshToken.update({
      where: { id: rotate.oldTokenId },
      data: { replacedById: created.id },
    });
  }

  return {
    accessToken: signAccessToken({ sub: user.id, role: user.role }),
    refreshToken,
  };
}

async function dispatchVerificationEmail(user: {
  id: string;
  name: string;
  email: string;
}) {
  const token = signEmailVerificationToken({ sub: user.id });
  try {
    await sendVerificationEmail({ to: user.email, name: user.name, token });
  } catch (err) {
    // Registration itself should still succeed even if the email provider
    // has a hiccup - the user can request another one via resendVerificationEmail.
    console.error("Failed to send verification email:", err);
  }
}

export const authRouter = router({
  register: publicProcedure.input(RegisterInput).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Diese E-Mail-Adresse wird bereits verwendet.",
      });
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const now = new Date();

    // SUCHENDE: name/address/Pflegegrad/... collected once here so
    // BookingForm can prefill instead of asking fresh every booking (see
    // careApplication.myCareProfile). BETREIBER: facility created in the
    // same transaction as the account - see RegisterBetreiberInput.
    const user =
      input.role === "SUCHENDE"
        ? await ctx.db.user.create({
            data: {
              name: `${input.vorname} ${input.nachname}`.trim(),
              vorname: input.vorname,
              nachname: input.nachname,
              email: input.email,
              passwordHash,
              role: "SUCHENDE",
              geburtsdatum: new Date(input.geburtsdatum),
              street: input.street,
              postalCode: input.postalCode,
              city: input.city,
              phone: input.phone,
              pflegegrad: input.pflegegrad ?? null,
              pflegegradAntragLaeuft: input.pflegegradAntragLaeuft,
              krankenkasse: input.krankenkasse ?? null,
              versicherungsnummerEncrypted: input.versicherungsnummer
                ? encryptSecret(input.versicherungsnummer)
                : null,
              hatBevollmaechtigten: input.hatBevollmaechtigten,
              bevollmaechtigterVorname: input.hatBevollmaechtigten
                ? input.bevollmaechtigterVorname
                : null,
              bevollmaechtigterNachname: input.hatBevollmaechtigten
                ? input.bevollmaechtigterNachname
                : null,
              bevollmaechtigterAdresse: input.hatBevollmaechtigten
                ? input.bevollmaechtigterAdresse
                : null,
              bevollmaechtigterTelefon: input.hatBevollmaechtigten
                ? input.bevollmaechtigterTelefon
                : null,
              bevollmaechtigterEmail: input.hatBevollmaechtigten
                ? input.bevollmaechtigterEmail
                : null,
              newsletterOptIn: input.newsletterOptIn,
              agbAcceptedAt: now,
              datenschutzAcceptedAt: now,
              verificationEmailSentAt: now,
            },
          })
        : await ctx.db.$transaction(async (tx) => {
            const betreiberUser = await tx.user.create({
              data: {
                name: input.name,
                email: input.email,
                passwordHash,
                role: "BETREIBER",
                agbAcceptedAt: now,
                verificationEmailSentAt: now,
              },
            });
            await createFacilityForOperator(tx, betreiberUser, {
              name: input.facilityName,
              description: "",
              street: input.street,
              postalCode: input.postalCode,
              city: input.city,
              state: input.state,
              amenities: [],
              operatorPhone: input.operatorPhone,
              operatorPhoneDurchwahl: input.operatorPhoneDurchwahl,
            });
            return betreiberUser;
          });

    await dispatchVerificationEmail(user);

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      ...(await issueTokens(ctx, user)),
    };
  }),

  login: publicProcedure.input(LoginInput).mutation(async ({ ctx, input }) => {
    const user = await ctx.db.user.findUnique({ where: { email: input.email } });

    if (!user) {
      await bcrypt.compare(input.password, await getDummyHash());
      throw new TRPCError({ code: "UNAUTHORIZED", message: GENERIC_LOGIN_ERROR });
    }

    const isLocked = user.lockedUntil && user.lockedUntil > new Date();
    if (isLocked) {
      await bcrypt.compare(input.password, await getDummyHash());
      throw new TRPCError({ code: "UNAUTHORIZED", message: GENERIC_LOGIN_ERROR });
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      await ctx.db.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil:
            attempts >= MAX_FAILED_ATTEMPTS
              ? new Date(Date.now() + LOCKOUT_DURATION_MS)
              : user.lockedUntil,
        },
      });
      throw new TRPCError({ code: "UNAUTHORIZED", message: GENERIC_LOGIN_ERROR });
    }

    await ctx.db.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    if (user.twoFactorEnabled) {
      return {
        twoFactorRequired: true as const,
        challengeToken: signTwoFactorChallengeToken({ sub: user.id }),
      };
    }

    return {
      twoFactorRequired: false as const,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      ...(await issueTokens(ctx, user)),
    };
  }),

  verifyTwoFactor: publicProcedure
    .input(z.object({ challengeToken: z.string().min(1), code: z.string().min(6).max(11) }))
    .mutation(async ({ ctx, input }) => {
      const payload = verifyTwoFactorChallengeToken(input.challengeToken);
      if (!payload) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const user = await ctx.db.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const isLocked = user.lockedUntil && user.lockedUntil > new Date();
      if (isLocked) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: GENERIC_LOGIN_ERROR });
      }

      let valid = verifyTotpCode(decryptSecret(user.twoFactorSecret), input.code);

      // Fall back to a recovery code if the input doesn't look like/match a
      // TOTP code - recovery codes are longer ("XXXX-XXXX") than the 6-digit
      // TOTP window this input also accepts.
      if (!valid) {
        const codeHash = hashToken(input.code.toUpperCase());
        const recoveryCode = await ctx.db.recoveryCode.findFirst({
          where: { userId: user.id, codeHash, usedAt: null },
        });
        if (recoveryCode) {
          await ctx.db.recoveryCode.update({
            where: { id: recoveryCode.id },
            data: { usedAt: new Date() },
          });
          valid = true;
        }
      }

      if (!valid) {
        const attempts = user.failedLoginAttempts + 1;
        await ctx.db.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: attempts,
            lockedUntil:
              attempts >= MAX_FAILED_ATTEMPTS
                ? new Date(Date.now() + LOCKOUT_DURATION_MS)
                : user.lockedUntil,
          },
        });
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Der Code ist ungültig." });
      }

      await ctx.db.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });

      return {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        ...(await issueTokens(ctx, user)),
      };
    }),

  refresh: publicProcedure
    .input(z.object({ refreshToken: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const payload = verifyRefreshToken(input.refreshToken);
      if (!payload) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const tokenHash = hashToken(input.refreshToken);
      const stored = await ctx.db.refreshToken.findUnique({ where: { tokenHash } });
      if (!stored || stored.expiresAt < new Date()) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      if (stored.revokedAt) {
        // Reuse of an already-rotated token is a theft signal - kill the
        // whole rotation chain, forcing a fresh login everywhere.
        await ctx.db.refreshToken.updateMany({
          where: { familyId: stored.familyId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Sitzung wurde aus Sicherheitsgründen beendet. Bitte erneut anmelden.",
        });
      }

      // Atomic claim: only the first of two concurrent refresh calls against
      // the same still-valid token succeeds; the loser is treated as reuse.
      const claim = await ctx.db.refreshToken.updateMany({
        where: { id: stored.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (claim.count === 0) {
        await ctx.db.refreshToken.updateMany({
          where: { familyId: stored.familyId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const user = await ctx.db.user.findUnique({ where: { id: stored.userId } });
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return issueTokens(ctx, user, { oldTokenId: stored.id, familyId: stored.familyId });
    }),

  logout: publicProcedure
    .input(z.object({ refreshToken: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      // Deliberately publicProcedure: an already-expired access token must
      // not block revoking the refresh token.
      if (input.refreshToken) {
        const tokenHash = hashToken(input.refreshToken);
        await ctx.db.refreshToken.updateMany({
          where: { tokenHash, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      return { success: true as const };
    }),

  bootstrapAdmin: publicProcedure
    .input(BootstrapAdminInput)
    .mutation(async ({ ctx, input }) => {
      const adminCount = await ctx.db.user.count({ where: { role: "ADMIN" } });
      if (adminCount > 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Es existiert bereits ein Admin-Konto.",
        });
      }

      const existing = await ctx.db.user.findUnique({ where: { email: input.email } });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Diese E-Mail-Adresse wird bereits verwendet.",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, 12);
      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          role: "ADMIN",
          emailVerifiedAt: new Date(),
        },
      });

      return {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        ...(await issueTokens(ctx, user)),
      };
    }),

  verifyEmail: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const payload = verifyEmailVerificationToken(input.token);
      if (!payload) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Der Bestätigungslink ist ungültig oder abgelaufen.",
        });
      }
      const user = await ctx.db.user.update({
        where: { id: payload.sub },
        data: { emailVerifiedAt: new Date() },
      });
      return { email: user.email };
    }),

  resendVerificationEmail: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.db.user.findUniqueOrThrow({ where: { id: ctx.user.id } });
    if (user.emailVerifiedAt) {
      return { success: true as const };
    }

    if (
      user.verificationEmailSentAt &&
      Date.now() - user.verificationEmailSentAt.getTime() < RESEND_COOLDOWN_MS
    ) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Bitte warte kurz, bevor du erneut eine Bestätigungs-E-Mail anforderst.",
      });
    }

    await ctx.db.user.update({
      where: { id: user.id },
      data: { verificationEmailSentAt: new Date() },
    });
    await dispatchVerificationEmail(user);
    return { success: true as const };
  }),

  forgotPassword: publicProcedure
    .input(ForgotPasswordInput)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({ where: { email: input.email } });
      // Anti-enumeration: always the same generic success, regardless of
      // whether the email exists - same discipline as GENERIC_LOGIN_ERROR.
      if (user) {
        const recent = await ctx.db.passwordResetToken.findFirst({
          where: {
            userId: user.id,
            createdAt: { gt: new Date(Date.now() - PASSWORD_RESET_COOLDOWN_MS) },
          },
        });
        if (!recent) {
          const token = signPasswordResetToken({ sub: user.id, jti: randomUUID() });
          await ctx.db.passwordResetToken.create({
            data: {
              userId: user.id,
              tokenHash: hashToken(token),
              expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_MS),
            },
          });
          try {
            await sendPasswordResetEmail({ to: user.email, name: user.name, token });
          } catch (err) {
            console.error("Failed to send password reset email:", err);
          }
        }
      }
      return { success: true as const };
    }),

  resetPassword: publicProcedure
    .input(ResetPasswordInput)
    .mutation(async ({ ctx, input }) => {
      const payload = verifyPasswordResetToken(input.token);
      if (!payload) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Der Link ist ungültig oder abgelaufen.",
        });
      }

      const resetToken = await ctx.db.passwordResetToken.findUnique({
        where: { tokenHash: hashToken(input.token) },
      });
      if (
        !resetToken ||
        resetToken.usedAt ||
        resetToken.expiresAt < new Date() ||
        resetToken.userId !== payload.sub
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Der Link ist ungültig oder abgelaufen.",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, 12);
      await ctx.db.$transaction([
        ctx.db.user.update({
          where: { id: resetToken.userId },
          data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
        }),
        ctx.db.passwordResetToken.update({
          where: { id: resetToken.id },
          data: { usedAt: new Date() },
        }),
        // Forces re-login on every device - standard practice for a
        // password change, in case the old password was compromised.
        ctx.db.refreshToken.updateMany({
          where: { userId: resetToken.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        }),
      ]);
      return { success: true as const };
    }),

  // Personal display name only - the facility's public "Ansprechpartner"
  // name is a separate, admin-approved field (see
  // operator.requestFacilityChange), deliberately not kept in sync with
  // this one.
  updateName: protectedProcedure
    .input(UpdateNameInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.user.id },
        data: { name: input.name },
      });
    }),

  // Step 1 of 2: mails a confirmation link to the CURRENT address. Nothing
  // changes yet - see confirmOldEmailChange for step 2, which is what
  // actually mails the new address.
  requestEmailChange: protectedProcedure
    .input(RequestEmailChangeInput)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUniqueOrThrow({ where: { id: ctx.user.id } });
      if (input.newEmail === user.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Das ist bereits deine aktuelle E-Mail-Adresse.",
        });
      }
      const taken = await ctx.db.user.findUnique({ where: { email: input.newEmail } });
      if (taken) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Diese E-Mail-Adresse wird bereits verwendet.",
        });
      }
      const recent = await ctx.db.emailChangeRequest.findFirst({
        where: {
          userId: user.id,
          createdAt: { gt: new Date(Date.now() - EMAIL_CHANGE_COOLDOWN_MS) },
        },
      });
      if (recent) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Bitte warte kurz, bevor du erneut eine E-Mail-Änderung anforderst.",
        });
      }

      // id generated upfront (rather than left to Prisma's default) so it
      // can be embedded as the token's `sub` before the row exists.
      const id = randomUUID();
      const token = signEmailChangeToken({ sub: id, jti: randomUUID() });
      await ctx.db.emailChangeRequest.create({
        data: {
          id,
          userId: user.id,
          newEmail: input.newEmail,
          oldEmailTokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + EMAIL_CHANGE_TOKEN_EXPIRY_MS),
        },
      });
      try {
        await sendEmailChangeOldAddressEmail({
          to: user.email,
          name: user.name,
          newEmail: input.newEmail,
          token,
        });
      } catch (err) {
        console.error("Failed to send email change (old address) email:", err);
      }
      return { success: true as const };
    }),

  // Step 2 of 2: the old address owner confirmed intent, so now mail the
  // NEW address to prove ownership - the actual User.email change happens
  // in confirmNewEmailChange, not here.
  confirmOldEmailChange: publicProcedure
    .input(ConfirmEmailChangeInput)
    .mutation(async ({ ctx, input }) => {
      const payload = verifyEmailChangeToken(input.token);
      if (!payload) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Der Link ist ungültig oder abgelaufen.",
        });
      }
      const request = await ctx.db.emailChangeRequest.findUnique({
        where: { oldEmailTokenHash: hashToken(input.token) },
      });
      if (
        !request ||
        request.id !== payload.sub ||
        request.oldConfirmedAt ||
        request.expiresAt < new Date()
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Der Link ist ungültig oder abgelaufen.",
        });
      }

      const user = await ctx.db.user.findUniqueOrThrow({ where: { id: request.userId } });
      const newToken = signEmailChangeToken({ sub: request.id, jti: randomUUID() });
      await ctx.db.emailChangeRequest.update({
        where: { id: request.id },
        data: { oldConfirmedAt: new Date(), newEmailTokenHash: hashToken(newToken) },
      });
      try {
        await sendEmailChangeNewAddressEmail({
          to: request.newEmail,
          name: user.name,
          token: newToken,
        });
      } catch (err) {
        console.error("Failed to send email change (new address) email:", err);
      }
      return { newEmail: request.newEmail };
    }),

  // The actual cutover: only reached once both the old and new address have
  // proven ownership. Revokes existing sessions, same as resetPassword.
  confirmNewEmailChange: publicProcedure
    .input(ConfirmEmailChangeInput)
    .mutation(async ({ ctx, input }) => {
      const payload = verifyEmailChangeToken(input.token);
      if (!payload) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Der Link ist ungültig oder abgelaufen.",
        });
      }
      const request = await ctx.db.emailChangeRequest.findUnique({
        where: { newEmailTokenHash: hashToken(input.token) },
      });
      if (
        !request ||
        request.id !== payload.sub ||
        !request.oldConfirmedAt ||
        request.newConfirmedAt ||
        request.expiresAt < new Date()
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Der Link ist ungültig oder abgelaufen.",
        });
      }

      // Re-check uniqueness - the address could have been taken by someone
      // else in the time between the two confirmation emails.
      const taken = await ctx.db.user.findUnique({ where: { email: request.newEmail } });
      if (taken && taken.id !== request.userId) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Diese E-Mail-Adresse wird inzwischen bereits verwendet.",
        });
      }

      await ctx.db.$transaction([
        ctx.db.user.update({
          where: { id: request.userId },
          data: { email: request.newEmail, emailVerifiedAt: new Date() },
        }),
        ctx.db.emailChangeRequest.update({
          where: { id: request.id },
          data: { newConfirmedAt: new Date() },
        }),
        ctx.db.refreshToken.updateMany({
          where: { userId: request.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        }),
      ]);
      return { email: request.newEmail };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerifiedAt: true,
        twoFactorEnabled: true,
      },
    });
    if (!user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return user;
  }),
});
