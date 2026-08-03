import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { BootstrapAdminInput, LoginInput, RegisterInput } from "@woodaa/validators";
import { z } from "zod";
import {
  signAccessToken,
  signEmailVerificationToken,
  signRefreshToken,
  verifyEmailVerificationToken,
  verifyRefreshToken,
} from "../auth";
import { sendVerificationEmail } from "../email";
import { protectedProcedure, publicProcedure, router } from "../trpc";

function issueTokens(user: { id: string; role: "SUCHENDE" | "BETREIBER" | "ADMIN" }) {
  return {
    accessToken: signAccessToken({ sub: user.id, role: user.role }),
    refreshToken: signRefreshToken({ sub: user.id }),
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
    const user = await ctx.db.user.create({
      data: { name: input.name, email: input.email, passwordHash, role: input.role },
    });

    await dispatchVerificationEmail(user);

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      ...issueTokens(user),
    };
  }),

  login: publicProcedure.input(LoginInput).mutation(async ({ ctx, input }) => {
    const user = await ctx.db.user.findUnique({ where: { email: input.email } });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "E-Mail oder Passwort ist falsch.",
      });
    }

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      ...issueTokens(user),
    };
  }),

  refresh: publicProcedure
    .input(z.object({ refreshToken: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const payload = verifyRefreshToken(input.refreshToken);
      if (!payload) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const user = await ctx.db.user.findUnique({ where: { id: payload.sub } });
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return issueTokens(user);
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
        ...issueTokens(user),
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
    await dispatchVerificationEmail(user);
    return { success: true as const };
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: { id: true, name: true, email: true, role: true, emailVerifiedAt: true },
    });
    if (!user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return user;
  }),
});
