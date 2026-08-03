import { TRPCError } from "@trpc/server";
import QRCode from "qrcode";
import { z } from "zod";
import { hashToken } from "../tokenHash";
import {
  decryptSecret,
  encryptSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  totpKeyUri,
  verifyTotpCode,
} from "../twoFactor";
import { adminProcedure, router } from "../trpc";

export const twoFactorRouter = router({
  // Starts (or restarts) setup: generates a fresh secret, stores it
  // encrypted but NOT yet enabled - enabling only happens once the admin
  // proves they can produce a matching code in setupConfirm.
  setupInitiate: adminProcedure.mutation(async ({ ctx }) => {
    const secret = generateTotpSecret();
    await ctx.db.user.update({
      where: { id: ctx.user.id },
      data: { twoFactorSecret: encryptSecret(secret), twoFactorEnabled: false },
    });

    const user = await ctx.db.user.findUniqueOrThrow({ where: { id: ctx.user.id } });
    const uri = totpKeyUri(user.email, secret);
    const qrDataUrl = await QRCode.toDataURL(uri);
    return { secret, qrDataUrl };
  }),

  setupConfirm: adminProcedure
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUniqueOrThrow({ where: { id: ctx.user.id } });
      if (!user.twoFactorSecret) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "2FA-Einrichtung wurde nicht gestartet.",
        });
      }
      if (!verifyTotpCode(decryptSecret(user.twoFactorSecret), input.code)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Der Code ist ungültig." });
      }

      // Clear any recovery codes from a previous setup attempt before
      // issuing a fresh batch, so old ones can't linger as valid.
      const recoveryCodes = generateRecoveryCodes();
      await ctx.db.$transaction([
        ctx.db.recoveryCode.deleteMany({ where: { userId: user.id } }),
        ctx.db.recoveryCode.createMany({
          data: recoveryCodes.map((code) => ({
            userId: user.id,
            codeHash: hashToken(code),
          })),
        }),
        ctx.db.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } }),
      ]);

      return { success: true as const, recoveryCodes };
    }),

  disable: adminProcedure
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUniqueOrThrow({ where: { id: ctx.user.id } });
      if (
        !user.twoFactorEnabled ||
        !user.twoFactorSecret ||
        !verifyTotpCode(decryptSecret(user.twoFactorSecret), input.code)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Der Code ist ungültig." });
      }

      await ctx.db.$transaction([
        ctx.db.recoveryCode.deleteMany({ where: { userId: user.id } }),
        ctx.db.user.update({
          where: { id: user.id },
          data: { twoFactorEnabled: false, twoFactorSecret: null },
        }),
      ]);

      return { success: true as const };
    }),
});
