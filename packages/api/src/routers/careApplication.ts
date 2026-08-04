import { TRPCError } from "@trpc/server";
import {
  SetCareApplicationStatusInput,
  SubmitCareApplicationInput,
  UpdateCareProfileInput,
} from "@woodaa/validators";
import { generateCareApplicationPdf } from "../carePdf";
import { decryptSecret, encryptSecret } from "../crypto";
import { sendCareApplicationEmail } from "../email";
import { protectedProcedure, router } from "../trpc";

// Single pilot Krankenkasse for now (see conversation - "erst eine Kasse
// als Pilot"). Deliberately not in the DB/seed: this is real-world config
// that must never ship with placeholder or test values baked in - unset
// in an environment just means the feature quietly stays unavailable
// there rather than emailing the wrong address.
function pilotKrankenkasse(): { name: string; email: string } | null {
  const name = process.env.PILOT_KRANKENKASSE_NAME;
  const email = process.env.PILOT_KRANKENKASSE_EMAIL;
  if (!name || !email) return null;
  return { name, email };
}

const bookingTypeLabels = {
  STATIONAERE_AUFNAHME: "Vollstationäre Pflege",
  KURZZEITPFLEGE: "Kurzzeitpflege",
  TAGESPFLEGE: "Tagespflege",
  NACHTPFLEGE: "Nachtpflege",
} as const;

export const careApplicationRouter = router({
  myCareProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUniqueOrThrow({
      where: { id: ctx.user.id },
      include: { careApplications: true },
    });

    return {
      name: user.name,
      versicherungsnummer: user.versicherungsnummerEncrypted
        ? decryptSecret(user.versicherungsnummerEncrypted)
        : null,
      pflegegrad: user.pflegegrad,
      pflegegradAntragLaeuft: user.pflegegradAntragLaeuft,
      krankenkasse: user.krankenkasse,
      applications: user.careApplications,
      krankenkasseConfigured: pilotKrankenkasse() !== null,
    };
  }),

  updateCareProfile: protectedProcedure
    .input(UpdateCareProfileInput)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: ctx.user.id },
        data: {
          ...(input.versicherungsnummer !== undefined
            ? { versicherungsnummerEncrypted: encryptSecret(input.versicherungsnummer) }
            : {}),
          ...(input.pflegegrad !== undefined ? { pflegegrad: input.pflegegrad } : {}),
          ...(input.pflegegradAntragLaeuft !== undefined
            ? { pflegegradAntragLaeuft: input.pflegegradAntragLaeuft }
            : {}),
          ...(input.krankenkasse !== undefined ? { krankenkasse: input.krankenkasse } : {}),
        },
      });
    }),

  setCareApplicationStatus: protectedProcedure
    .input(SetCareApplicationStatusInput)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.careApplication.upsert({
        where: {
          userId_bookingType: { userId: ctx.user.id, bookingType: input.bookingType },
        },
        create: { userId: ctx.user.id, bookingType: input.bookingType, status: input.status },
        update: { status: input.status },
      });
    }),

  submitCareApplication: protectedProcedure
    .input(SubmitCareApplicationInput)
    .mutation(async ({ ctx, input }) => {
      const kasse = pilotKrankenkasse();
      if (!kasse) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Die digitale Antragstellung ist noch nicht für eine Krankenkasse eingerichtet.",
        });
      }

      const user = await ctx.db.user.findUniqueOrThrow({ where: { id: ctx.user.id } });
      if (!user.versicherungsnummerEncrypted) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Bitte hinterlege zuerst deine Versicherungsnummer.",
        });
      }

      const versicherungsnummer = decryptSecret(user.versicherungsnummerEncrypted);
      const submittedAt = new Date();

      const pdfBytes = await generateCareApplicationPdf({
        applicantName: user.name,
        applicantEmail: user.email,
        versicherungsnummer,
        pflegegrad: user.pflegegrad,
        bookingType: input.bookingType,
        signatureName: input.signatureName,
        submittedAt,
      });

      await sendCareApplicationEmail({
        to: kasse.email,
        applicantName: user.name,
        bookingTypeLabel: bookingTypeLabels[input.bookingType],
        versicherungsnummer,
        pdfBytes,
      });

      await ctx.db.careApplication.upsert({
        where: {
          userId_bookingType: { userId: ctx.user.id, bookingType: input.bookingType },
        },
        create: {
          userId: ctx.user.id,
          bookingType: input.bookingType,
          status: "EINGEREICHT_UEBER_WOODAA",
          submittedAt,
        },
        update: { status: "EINGEREICHT_UEBER_WOODAA", submittedAt },
      });
    }),
});
