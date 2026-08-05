import { ChatMessageInput, CreateSupportRequestInput } from "@woodaa/validators";
import { publicProcedure, router } from "../trpc";

const CHAT_SYSTEM_PROMPT = `Du bist der Kundenservice-Chat von woodaa, einer Plattform, die Familien mit Pflegeeinrichtungen in Deutschland verbindet (stationäre Aufnahme, Kurzzeitpflege, Tages-/Nachtpflege).
Beantworte Fragen zu woodaa selbst: Suche, Buchung, Zahlung, Bewertungen, Konto, Pflegegrad-Zuschüsse (allgemein, keine Rechtsberatung). Sei kurz, freundlich und auf Deutsch.
Wenn eine Frage individuelle rechtliche/medizinische Beratung braucht oder du sie nicht sicher beantworten kannst, verweise auf den Rückruf- oder Kontaktformular-Weg im Hilfe-Menü statt zu spekulieren.`;

// Minimal Anthropic integration via a plain fetch call rather than the SDK -
// same reasoning as email.ts's Resend integration: one less dependency in a
// serverless bundle for a single JSON POST.
async function callAnthropic(messages: ChatMessageInput["messages"]): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return "Der KI-Chat ist gerade nicht verfügbar. Nutze gerne den Rückruf oder das Kontaktformular weiter unten - wir melden uns persönlich bei dir.";
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: CHAT_SYSTEM_PROMPT,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`Anthropic chat error ${res.status}: ${body}`);
    return "Der KI-Chat hat gerade ein Problem. Nutze gerne den Rückruf oder das Kontaktformular weiter unten - wir melden uns persönlich bei dir.";
  }

  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = data.content?.find((block) => block.type === "text")?.text;
  return text ?? "Entschuldige, da ist etwas schiefgelaufen. Versuch es gerne nochmal.";
}

export const supportRouter = router({
  create: publicProcedure.input(CreateSupportRequestInput).mutation(async ({ ctx, input }) => {
    return ctx.db.supportRequest.create({
      data: {
        type: input.type,
        name: input.name,
        email: input.email,
        phone: input.phone,
        message: input.message,
        pageUrl: input.pageUrl,
        userId: ctx.user?.id,
      },
    });
  }),

  chat: publicProcedure.input(ChatMessageInput).mutation(async ({ input }) => {
    const reply = await callAnthropic(input.messages);
    return { reply };
  }),
});
