import { TRPCError } from "@trpc/server";
import { ConversationIdInput, SendMessageInput } from "@woodaa/validators";
import { sendOperatorNewMessageEmail } from "../email";
import { withPhotoUrl } from "../r2";
import { protectedProcedure, router } from "../trpc";

// The searching-user side of the "message the facility" feature - see
// Conversation/Message in schema.prisma. A facility never starts a thread
// cold; it only ever replies (see operator.replyToConversation), so every
// mutation here belongs to the user side of the conversation.
export const messageRouter = router({
  // Inbox list - one row per facility the user has ever messaged, newest
  // activity first.
  myConversations: protectedProcedure.query(async ({ ctx }) => {
    const conversations = await ctx.db.conversation.findMany({
      where: { userId: ctx.user.id },
      orderBy: { lastMessageAt: "desc" },
      select: {
        id: true,
        lastMessageAt: true,
        userLastReadAt: true,
        facility: {
          select: {
            name: true,
            slug: true,
            photos: { take: 1, orderBy: { createdAt: "asc" } },
          },
        },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    return conversations.map((c) => ({
      id: c.id,
      lastMessageAt: c.lastMessageAt,
      facility: { ...c.facility, photos: c.facility.photos.map(withPhotoUrl) },
      lastMessage: c.messages[0] ?? null,
      // Unread = the facility replied more recently than the user last
      // opened this thread (or the user never opened it at all).
      unread:
        c.messages[0]?.senderIsFacility === true &&
        (c.userLastReadAt === null || c.userLastReadAt < c.lastMessageAt),
    }));
  }),

  // Full message history for one thread - verifies ownership via userId,
  // same as booking.myCancel's requireUserId pattern.
  conversation: protectedProcedure.input(ConversationIdInput).query(async ({ ctx, input }) => {
    const conversation = await ctx.db.conversation.findUnique({
      where: { id: input.conversationId },
      include: {
        facility: { select: { name: true, slug: true, operatorName: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!conversation || conversation.userId !== ctx.user.id) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Unterhaltung nicht gefunden." });
    }
    return conversation;
  }),

  // Starts a new thread with a facility, or appends to the existing one if
  // this user has already messaged them before (see Conversation's
  // @@unique([facilityId, userId])).
  send: protectedProcedure.input(SendMessageInput).mutation(async ({ ctx, input }) => {
    const facility = await ctx.db.facility.findUnique({
      where: { id: input.facilityId, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        operator: { select: { name: true, email: true } },
      },
    });
    if (!facility) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Einrichtung nicht gefunden." });
    }

    const now = new Date();
    const conversation = await ctx.db.conversation.upsert({
      where: { facilityId_userId: { facilityId: input.facilityId, userId: ctx.user.id } },
      create: { facilityId: input.facilityId, userId: ctx.user.id, lastMessageAt: now },
      update: { lastMessageAt: now },
    });
    const message = await ctx.db.message.create({
      data: { conversationId: conversation.id, senderIsFacility: false, body: input.body },
    });

    // Best-effort, same "never block the actual mutation" treatment as
    // every other notification call site in this codebase (see
    // sendPushNotification's own comment).
    if (facility.operator) {
      const user = await ctx.db.user.findUniqueOrThrow({ where: { id: ctx.user.id } });
      try {
        await sendOperatorNewMessageEmail({
          to: facility.operator.email,
          operatorName: facility.operator.name,
          senderName: user.name,
          facilityName: facility.name,
          body: input.body,
        });
      } catch (err) {
        console.error("sendOperatorNewMessageEmail failed", err);
      }
    }

    return message;
  }),

  markRead: protectedProcedure.input(ConversationIdInput).mutation(async ({ ctx, input }) => {
    await ctx.db.conversation.updateMany({
      where: { id: input.conversationId, userId: ctx.user.id },
      data: { userLastReadAt: new Date() },
    });
  }),
});
