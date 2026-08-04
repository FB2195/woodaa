import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { decryptSecret } from "../crypto";
import { protectedProcedure, router } from "../trpc";

export const accountRouter = router({
  // Art. 15/20 DSGVO: self-service data export, scoped to data that is
  // actually "about me" - an operator's export includes their own facility
  // listing, but not the bookingRequests they've received (that's personal
  // data belonging to the requesting Suchende, not the operator).
  exportData: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUniqueOrThrow({
      where: { id: ctx.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        emailVerifiedAt: true,
        versicherungsnummerEncrypted: true,
        pflegegrad: true,
        pflegegradAntragLaeuft: true,
      },
    });
    const { versicherungsnummerEncrypted, ...profile } = user;
    const profileWithVersicherungsnummer = {
      ...profile,
      versicherungsnummer: versicherungsnummerEncrypted
        ? decryptSecret(versicherungsnummerEncrypted)
        : null,
    };

    if (user.role === "SUCHENDE") {
      const [bookingRequests, careApplications] = await Promise.all([
        ctx.db.bookingRequest.findMany({
          where: { requesterEmail: { equals: user.email, mode: "insensitive" } },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.careApplication.findMany({ where: { userId: user.id } }),
      ]);
      return {
        profile: profileWithVersicherungsnummer,
        bookingRequests,
        careApplications,
      };
    }

    if (user.role === "BETREIBER") {
      const facility = await ctx.db.facility.findUnique({
        where: { operatorUserId: user.id },
        include: { capacities: true, units: { include: { bookings: true } } },
      });
      return { profile: profileWithVersicherungsnummer, facility };
    }

    return { profile: profileWithVersicherungsnummer };
  }),

  deleteAccount: protectedProcedure
    .input(z.object({ password: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUniqueOrThrow({ where: { id: ctx.user.id } });

      const validPassword = await bcrypt.compare(input.password, user.passwordHash);
      if (!validPassword) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Passwort ist falsch." });
      }

      if (user.role === "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin-Konten können nicht selbst gelöscht werden.",
        });
      }

      if (user.role === "BETREIBER") {
        const facility = await ctx.db.facility.findUnique({
          where: { operatorUserId: user.id },
        });
        if (facility) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Du betreibst noch eine Einrichtung. Bitte kontaktiere uns, damit wir das gemeinsam klären, bevor dein Konto gelöscht werden kann.",
          });
        }
      }

      await ctx.db.$transaction([
        ctx.db.bookingRequest.deleteMany({
          where: { requesterEmail: { equals: user.email, mode: "insensitive" } },
        }),
        // RefreshToken/RecoveryCode cascade automatically via onDelete: Cascade.
        ctx.db.user.delete({ where: { id: user.id } }),
      ]);

      return { success: true as const };
    }),
});
