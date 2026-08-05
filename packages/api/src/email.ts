/**
 * Minimal Resend integration via a plain fetch call rather than the
 * `resend` SDK — one less dependency to go wrong in a serverless bundle,
 * and the API is a single JSON POST.
 */
function appUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function logoHtml(): string {
  return `<p><img src="${appUrl()}/logo.png" alt="woodaa" width="160" style="display:block;height:auto;max-width:160px" /></p>`;
}

async function sendEmail({
  to,
  subject,
  html,
  text,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: { filename: string; content: string }[];
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Don't hard-fail registration if email isn't configured yet (e.g. a
    // fresh local dev setup) - log loudly instead.
    console.error("RESEND_API_KEY is not set - skipping email send:", subject);
    return;
  }

  const from = process.env.EMAIL_FROM ?? "woodaa <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    // A plain-text part alongside html isn't just an accessibility nicety -
    // HTML-only mail is a well-known spam-filter signal, especially for a
    // domain with no sending history yet.
    body: JSON.stringify({ from, to, subject, html, text, attachments }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`Resend API error ${res.status}: ${body}`);
  }
}

export async function sendVerificationEmail({
  to,
  name,
  token,
}: {
  to: string;
  name: string;
  token: string;
}) {
  const verifyUrl = `${appUrl()}/verify-email?token=${encodeURIComponent(token)}`;

  await sendEmail({
    to,
    subject: "Bitte bestätige deine E-Mail-Adresse bei woodaa",
    html: `
      ${logoHtml()}
      <p>Hallo ${name},</p>
      <p>bitte bestätige deine E-Mail-Adresse, um dein woodaa-Konto zu aktivieren:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>Der Link ist 24 Stunden gültig.</p>
      <p>Falls du dich nicht bei woodaa registriert hast, kannst du diese E-Mail ignorieren.</p>
    `,
    text: `Hallo ${name},

bitte bestätige deine E-Mail-Adresse, um dein woodaa-Konto zu aktivieren:
${verifyUrl}

Der Link ist 24 Stunden gültig.

Falls du dich nicht bei woodaa registriert hast, kannst du diese E-Mail ignorieren.`,
  });
}

export async function sendPasswordResetEmail({
  to,
  name,
  token,
}: {
  to: string;
  name: string;
  token: string;
}) {
  const resetUrl = `${appUrl()}/passwort-zuruecksetzen?token=${encodeURIComponent(token)}`;

  await sendEmail({
    to,
    subject: "Passwort zurücksetzen bei woodaa",
    html: `
      ${logoHtml()}
      <p>Hallo ${name},</p>
      <p>du hast angefordert, dein Passwort bei woodaa zurückzusetzen:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Der Link ist 1 Stunde gültig und nur einmal verwendbar.</p>
      <p>Falls du das nicht warst, kannst du diese E-Mail ignorieren — dein Passwort bleibt unverändert.</p>
    `,
    text: `Hallo ${name},

du hast angefordert, dein Passwort bei woodaa zurückzusetzen:
${resetUrl}

Der Link ist 1 Stunde gültig und nur einmal verwendbar.

Falls du das nicht warst, kannst du diese E-Mail ignorieren — dein Passwort bleibt unverändert.`,
  });
}

// The Pflegekasse-facing side of the "Antrag digital einreichen" flow
// (see routers/careApplication.ts) - a filled, digitally-signed PDF sent
// as an attachment, with the Versicherungsnummer in the subject so it's
// routable on the Kasse's side without opening the PDF first.
export async function sendCareApplicationEmail({
  to,
  applicantName,
  bookingTypeLabel,
  versicherungsnummer,
  pdfBytes,
}: {
  to: string;
  applicantName: string;
  bookingTypeLabel: string;
  versicherungsnummer: string;
  pdfBytes: Uint8Array;
}) {
  const subject = `Antrag ${bookingTypeLabel} - Versicherungsnummer ${versicherungsnummer}`;
  const content = Buffer.from(pdfBytes).toString("base64");
  const fileSlug = bookingTypeLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  await sendEmail({
    to,
    subject,
    html: `
      <p>Antrag auf Kostenübernahme für <strong>${bookingTypeLabel}</strong></p>
      <p>Versicherte Person: ${applicantName}<br />Versicherungsnummer: ${versicherungsnummer}</p>
      <p>Digital eingereicht über woodaa (woodaa.de). Siehe angehängtes PDF für die vollständigen Angaben und die digitale Signatur.</p>
    `,
    text: `Antrag auf Kostenübernahme für ${bookingTypeLabel}

Versicherte Person: ${applicantName}
Versicherungsnummer: ${versicherungsnummer}

Digital eingereicht über woodaa (woodaa.de). Siehe angehängtes PDF für die vollständigen Angaben und die digitale Signatur.`,
    attachments: [{ filename: `antrag-${fileSlug}.pdf`, content }],
  });
}
