/**
 * Minimal Resend integration via a plain fetch call rather than the
 * `resend` SDK — one less dependency to go wrong in a serverless bundle,
 * and the API is a single JSON POST.
 */
function appUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL;
  // VERCEL_ENV is "production" for the live custom domain and "preview" for
  // per-PR/per-branch deployments - only preview builds should ever link to
  // their own ephemeral *.vercel.app URL. Production (and any non-Vercel
  // prod deploy that forgot to set APP_URL) must always link back to the
  // real domain, not whichever deployment happened to send the email.
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
    return "https://woodaa.de";
  }
  return "http://localhost:3000";
}

function logoHtml(): string {
  return `<p><img src="${appUrl()}/logo.png" alt="woodaa" width="160" style="display:block;height:auto;max-width:160px" /></p>`;
}

// Escapes user-supplied strings (facility/guest names etc.) before they go
// into an html email body - used by newer functions in this file. The
// existing functions above predate this and interpolate raw strings; not
// retrofitted here to keep this change scoped to what actually needs it.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

export async function sendEmailChangeOldAddressEmail({
  to,
  name,
  newEmail,
  token,
}: {
  to: string;
  name: string;
  newEmail: string;
  token: string;
}) {
  const confirmUrl = `${appUrl()}/konto/email-bestaetigen?step=old&token=${encodeURIComponent(token)}`;

  await sendEmail({
    to,
    subject: "Bestätige die Änderung deiner E-Mail-Adresse bei woodaa",
    html: `
      ${logoHtml()}
      <p>Hallo ${name},</p>
      <p>du hast angefordert, deine E-Mail-Adresse bei woodaa auf <strong>${newEmail}</strong> zu ändern:</p>
      <p><a href="${confirmUrl}">${confirmUrl}</a></p>
      <p>Der Link ist 1 Stunde gültig. Erst nachdem du hier bestätigst, schicken wir eine Bestätigungs-E-Mail an die neue Adresse.</p>
      <p>Falls du das nicht warst, kannst du diese E-Mail ignorieren — deine E-Mail-Adresse bleibt unverändert.</p>
    `,
    text: `Hallo ${name},

du hast angefordert, deine E-Mail-Adresse bei woodaa auf ${newEmail} zu ändern:
${confirmUrl}

Der Link ist 1 Stunde gültig. Erst nachdem du hier bestätigst, schicken wir eine Bestätigungs-E-Mail an die neue Adresse.

Falls du das nicht warst, kannst du diese E-Mail ignorieren — deine E-Mail-Adresse bleibt unverändert.`,
  });
}

export async function sendEmailChangeNewAddressEmail({
  to,
  name,
  token,
}: {
  to: string;
  name: string;
  token: string;
}) {
  const confirmUrl = `${appUrl()}/konto/email-bestaetigen?step=new&token=${encodeURIComponent(token)}`;

  await sendEmail({
    to,
    subject: "Bestätige deine neue E-Mail-Adresse bei woodaa",
    html: `
      ${logoHtml()}
      <p>Hallo ${name},</p>
      <p>bitte bestätige, dass diese Adresse deine neue E-Mail-Adresse bei woodaa werden soll:</p>
      <p><a href="${confirmUrl}">${confirmUrl}</a></p>
      <p>Der Link ist 1 Stunde gültig. Danach ist diese Adresse deine neue Login-E-Mail-Adresse.</p>
    `,
    text: `Hallo ${name},

bitte bestätige, dass diese Adresse deine neue E-Mail-Adresse bei woodaa werden soll:
${confirmUrl}

Der Link ist 1 Stunde gültig. Danach ist diese Adresse deine neue Login-E-Mail-Adresse.`,
  });
}

// Shared by every booking-related email (initial confirmation, facility
// decision): sends to the account's Bevollmächtigter instead of the
// Versicherte/n if one was declared at registration - purely informational
// contact fields, not to be confused with the document-based
// "Bevollmächtigte/r Angehörige/r" flow (User.vollmachtDocumentKey).
export function resolveBookingRecipient(user: {
  name: string;
  email: string;
  hatBevollmaechtigten: boolean;
  bevollmaechtigterVorname: string | null;
  bevollmaechtigterNachname: string | null;
  bevollmaechtigterEmail: string | null;
}): { to: string; recipientName: string } {
  if (user.hatBevollmaechtigten && user.bevollmaechtigterEmail) {
    return {
      to: user.bevollmaechtigterEmail,
      recipientName: user.bevollmaechtigterVorname
        ? `${user.bevollmaechtigterVorname} ${user.bevollmaechtigterNachname ?? ""}`.trim()
        : user.name,
    };
  }
  return { to: user.email, recipientName: user.name };
}

const bookingTypeLabels: Record<string, string> = {
  STATIONAERE_AUFNAHME: "Stationäre Aufnahme",
  KURZZEITPFLEGE: "Kurzzeitpflege",
  TAGESPFLEGE: "Tagespflege",
  NACHTPFLEGE: "Nachtpflege",
};

function formatGermanDate(date: Date): string {
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Direkt nach dem Anlegen einer Buchung verschickt (unabhängig vom
// Zahlungsstatus) - die spätere Bestätigung/Ablehnung durch das Pflegeheim
// löst eine eigene, separate E-Mail aus (siehe sendBookingFacilityDecisionEmail).
export async function sendBookingConfirmationEmail({
  to,
  recipientName,
  guestName,
  facilityName,
  facilitySlug,
  bookingType,
  startDate,
  endDate,
  facilityApprovalRequired,
}: {
  to: string;
  recipientName: string;
  guestName: string;
  facilityName: string;
  facilitySlug: string;
  bookingType: string;
  startDate: Date | null;
  endDate: Date | null;
  // True when the facility has manual booking approval enabled - in that
  // case a second email follows once it decides (see
  // sendBookingFacilityDecisionEmail). Otherwise the booking is already
  // final and no further "confirmed" email will come.
  facilityApprovalRequired: boolean;
}) {
  const bookingTypeLabel = bookingTypeLabels[bookingType] ?? bookingType;
  const facilityUrl = `${appUrl()}/einrichtung/${facilitySlug}`;
  const dateRangeLine = startDate
    ? `Zeitraum: ${formatGermanDate(startDate)} bis ${endDate ? formatGermanDate(endDate) : "auf Weiteres"}`
    : null;
  const statusLine = facilityApprovalRequired
    ? "Die Einrichtung prüft deine Buchung noch - wir informieren dich per E-Mail, sobald sie bestätigt wurde."
    : "Deine Buchung ist bestätigt.";

  await sendEmail({
    to,
    subject: `Buchungsbestätigung: ${bookingTypeLabel} bei ${facilityName}`,
    html: `
      ${logoHtml()}
      <p>Hallo ${recipientName},</p>
      <p>vielen Dank für die Buchung über woodaa. Wir haben deine Anfrage erhalten:</p>
      <ul>
        <li>Einrichtung: <a href="${facilityUrl}">${facilityName}</a></li>
        <li>Leistung: ${bookingTypeLabel}</li>
        <li>Versicherte Person: ${guestName}</li>
        ${dateRangeLine ? `<li>${dateRangeLine}</li>` : ""}
      </ul>
      <p>${statusLine}</p>
      <p>Den aktuellen Status deiner Buchung findest du jederzeit unter "Meine Buchungen" in deinem woodaa-Konto: <a href="${appUrl()}/konto">${appUrl()}/konto</a></p>
    `,
    text: `Hallo ${recipientName},

vielen Dank für die Buchung über woodaa. Wir haben deine Anfrage erhalten:

Einrichtung: ${facilityName} (${facilityUrl})
Leistung: ${bookingTypeLabel}
Versicherte Person: ${guestName}
${dateRangeLine ? dateRangeLine + "\n" : ""}
${statusLine}

Den aktuellen Status deiner Buchung findest du jederzeit unter "Meine Buchungen" in deinem woodaa-Konto: ${appUrl()}/konto`,
  });
}

// Verschickt, wenn eine Einrichtung mit bookingApprovalMode=MANUELL eine
// Buchung annimmt oder ablehnt (siehe operator.confirmBooking/rejectBooking),
// bei einer Ablehnung durch die Zahlungsfreigabe des Heims
// (operator.rejectBookingPayment) oder durch die woodaa-Freigabe für
// bevollmächtigte Accounts (admin.rejectBookingAdmin) - der `rejectionSource`
// steuert nur die Formulierung, nicht den Versand selbst - sowie wenn eine
// Karte/Klarna/PayPal-Zahlung fehlschlägt/abgebrochen wird (siehe
// webhooks.ts). Getrennt von sendBookingConfirmationEmail, die sofort bei
// Buchungseingang rausgeht, unabhängig von diesem späteren Entscheid.
export async function sendBookingFacilityDecisionEmail({
  to,
  recipientName,
  guestName,
  facilityName,
  facilitySlug,
  bookingType,
  decision,
  rejectionSource = "EINRICHTUNG",
}: {
  to: string;
  recipientName: string;
  guestName: string;
  facilityName: string;
  facilitySlug: string;
  bookingType: string;
  decision: "BESTAETIGT" | "ABGELEHNT" | "ZAHLUNG_FEHLGESCHLAGEN";
  // Nur relevant bei decision=ABGELEHNT: wer genau die Buchung storniert hat
  // - "EINRICHTUNG" (rejectBooking) lehnt die Buchung selbst ab, "ZAHLUNG"
  // (rejectBookingPayment) lehnt nur die gewählte Zahlungsart ab, "WOODAA"
  // (admin.rejectBookingAdmin) ist die Freigabe für bevollmächtigte Accounts.
  rejectionSource?: "EINRICHTUNG" | "ZAHLUNG" | "WOODAA";
}) {
  const bookingTypeLabel = bookingTypeLabels[bookingType] ?? bookingType;
  const facilityUrl = `${appUrl()}/einrichtung/${facilitySlug}`;
  const accountUrl = `${appUrl()}/konto`;

  const subject =
    decision === "BESTAETIGT"
      ? `Deine Buchung bei ${facilityName} wurde bestätigt`
      : decision === "ABGELEHNT"
        ? `Deine Buchung bei ${facilityName} konnte nicht bestätigt werden`
        : `Zahlung für deine Buchung bei ${facilityName} war nicht erfolgreich`;

  const rejectionReasonSentence: Record<"EINRICHTUNG" | "ZAHLUNG" | "WOODAA", string> = {
    EINRICHTUNG: `<strong>${facilityName}</strong> konnte deine Buchung (${bookingTypeLabel} für ${guestName}) leider nicht annehmen.`,
    ZAHLUNG: `<strong>${facilityName}</strong> hat die gewählte Zahlungsart für deine Buchung (${bookingTypeLabel} für ${guestName}) leider nicht freigegeben.`,
    WOODAA: `woodaa konnte deine Buchung (${bookingTypeLabel} für ${guestName}) bei <strong>${facilityName}</strong> leider nicht freigeben.`,
  };
  const rejectionReasonSentenceText: Record<"EINRICHTUNG" | "ZAHLUNG" | "WOODAA", string> = {
    EINRICHTUNG: `${facilityName} konnte deine Buchung (${bookingTypeLabel} für ${guestName}) leider nicht annehmen.`,
    ZAHLUNG: `${facilityName} hat die gewählte Zahlungsart für deine Buchung (${bookingTypeLabel} für ${guestName}) leider nicht freigegeben.`,
    WOODAA: `woodaa konnte deine Buchung (${bookingTypeLabel} für ${guestName}) bei ${facilityName} leider nicht freigeben.`,
  };

  const bodyHtml =
    decision === "BESTAETIGT"
      ? `<p><strong>${facilityName}</strong> hat deine Buchung (${bookingTypeLabel} für ${guestName}) bestätigt.</p>`
      : decision === "ABGELEHNT"
        ? `<p>${rejectionReasonSentence[rejectionSource]} Die Buchung wurde storniert, eine eventuell bereits erfolgte Zahlung wird automatisch erstattet.</p>`
        : `<p>Die Zahlung für deine Buchung (${bookingTypeLabel} für ${guestName}) bei <strong>${facilityName}</strong> konnte nicht abgeschlossen werden. Die Buchung wurde storniert und der Platz wieder freigegeben. Du kannst gerne erneut buchen, sobald das Zahlungsproblem behoben ist.</p>`;

  const bodyText =
    decision === "BESTAETIGT"
      ? `${facilityName} hat deine Buchung (${bookingTypeLabel} für ${guestName}) bestätigt.`
      : decision === "ABGELEHNT"
        ? `${rejectionReasonSentenceText[rejectionSource]} Die Buchung wurde storniert, eine eventuell bereits erfolgte Zahlung wird automatisch erstattet.`
        : `Die Zahlung für deine Buchung (${bookingTypeLabel} für ${guestName}) bei ${facilityName} konnte nicht abgeschlossen werden. Die Buchung wurde storniert und der Platz wieder freigegeben. Du kannst gerne erneut buchen, sobald das Zahlungsproblem behoben ist.`;

  await sendEmail({
    to,
    subject,
    html: `
      ${logoHtml()}
      <p>Hallo ${recipientName},</p>
      ${bodyHtml}
      <p>Einrichtung: <a href="${facilityUrl}">${facilityName}</a></p>
      <p>Details findest du unter "Meine Buchungen" in deinem woodaa-Konto: <a href="${accountUrl}">${accountUrl}</a></p>
    `,
    text: `Hallo ${recipientName},

${bodyText}

Einrichtung: ${facilityName} (${facilityUrl})

Details findest du unter "Meine Buchungen" in deinem woodaa-Konto: ${accountUrl}`,
  });
}

// Verschickt an den Betreiber-Account einer Einrichtung, sobald eine neue
// Buchung eintrifft, die aktiv sein Zutun braucht - entweder weil die
// Einrichtung bookingApprovalMode=MANUELL nutzt (facilityApprovalRequired)
// oder weil die Zahlungsart RECHNUNG/KOSTENUEBERNAHME_KASSE erst seine
// Freigabe braucht (paymentApprovalRequired), siehe booking.create. Beide
// Fälle können gleichzeitig zutreffen. Anders als sendBookingConfirmationEmail
// geht diese Mail nicht an den Buchenden, sondern an den Betreiber.
export async function sendOperatorNewBookingEmail({
  to,
  operatorName,
  guestName,
  facilityName,
  bookingType,
  startDate,
  endDate,
  facilityApprovalRequired,
  paymentApprovalRequired,
}: {
  to: string;
  operatorName: string;
  guestName: string;
  facilityName: string;
  bookingType: string;
  startDate: Date | null;
  endDate: Date | null;
  facilityApprovalRequired: boolean;
  paymentApprovalRequired: boolean;
}) {
  const bookingTypeLabel = bookingTypeLabels[bookingType] ?? bookingType;
  const dashboardUrl = `${appUrl()}/betreiber/dashboard`;
  const dateRangeLine = startDate
    ? `Zeitraum: ${formatGermanDate(startDate)} bis ${endDate ? formatGermanDate(endDate) : "auf Weiteres"}`
    : null;

  const actionSentences: string[] = [];
  if (facilityApprovalRequired) {
    actionSentences.push("Die Buchung wartet auf deine Bestätigung.");
  }
  if (paymentApprovalRequired) {
    actionSentences.push("Die gewählte Zahlungsart wartet auf deine Freigabe.");
  }
  const actionLine = actionSentences.join(" ");

  await sendEmail({
    to,
    subject: `Neue Buchung bei ${facilityName}: ${bookingTypeLabel}`,
    html: `
      ${logoHtml()}
      <p>Hallo ${operatorName},</p>
      <p>bei <strong>${facilityName}</strong> ist eine neue Buchung eingegangen:</p>
      <ul>
        <li>Leistung: ${bookingTypeLabel}</li>
        <li>Versicherte Person: ${guestName}</li>
        ${dateRangeLine ? `<li>${dateRangeLine}</li>` : ""}
      </ul>
      <p>${actionLine}</p>
      <p>Details findest du in deinem woodaa-Dashboard: <a href="${dashboardUrl}">${dashboardUrl}</a></p>
    `,
    text: `Hallo ${operatorName},

bei ${facilityName} ist eine neue Buchung eingegangen:

Leistung: ${bookingTypeLabel}
Versicherte Person: ${guestName}
${dateRangeLine ? dateRangeLine + "\n" : ""}
${actionLine}

Details findest du in deinem woodaa-Dashboard: ${dashboardUrl}`,
  });
}

// Nachfass-Mail, falls eine MANUELL-Freigabe-Buchung nach
// REMINDER_AFTER_HOURS (siehe approvalEscalation.ts) immer noch auf
// facilityApprovalStatus=AUSSTEHEND steht - die ursprüngliche
// sendOperatorNewBookingEmail ging zum Buchungszeitpunkt schon einmal raus,
// das hier ist der Reminder, falls seither nichts passiert ist.
export async function sendOperatorApprovalReminderEmail({
  to,
  operatorName,
  guestName,
  facilityName,
  bookingType,
}: {
  to: string;
  operatorName: string;
  guestName: string;
  facilityName: string;
  bookingType: string;
}) {
  const bookingTypeLabel = bookingTypeLabels[bookingType] ?? bookingType;
  const dashboardUrl = `${appUrl()}/betreiber/dashboard`;
  const safeOperatorName = escapeHtml(operatorName);
  const safeGuestName = escapeHtml(guestName);
  const safeFacilityName = escapeHtml(facilityName);

  await sendEmail({
    to,
    subject: `Erinnerung: Buchung bei ${facilityName} wartet noch auf deine Bestätigung`,
    html: `
      ${logoHtml()}
      <p>Hallo ${safeOperatorName},</p>
      <p>eine Buchung bei <strong>${safeFacilityName}</strong> wartet weiterhin auf deine
      Bestätigung oder Ablehnung:</p>
      <ul>
        <li>Leistung: ${bookingTypeLabel}</li>
        <li>Versicherte Person: ${safeGuestName}</li>
      </ul>
      <p>Bitte entscheide zeitnah in deinem woodaa-Dashboard:
      <a href="${dashboardUrl}">${dashboardUrl}</a></p>
    `,
    text: `Hallo ${operatorName},

eine Buchung bei ${facilityName} wartet weiterhin auf deine Bestätigung oder Ablehnung:

Leistung: ${bookingTypeLabel}
Versicherte Person: ${guestName}

Bitte entscheide zeitnah in deinem woodaa-Dashboard: ${dashboardUrl}`,
  });
}

// Verschickt an die in ADMIN_NOTIFICATION_EMAIL hinterlegte woodaa-Adresse,
// sobald eine Buchung von einem bevollmächtigten Account (siehe
// User.vollmachtDocumentKey) auf die Freigabe durch woodaa-Mitarbeitende
// wartet (admin.pendingBookingApprovals). Keine Empfängerlogik nötig - im
// Unterschied zu resolveBookingRecipient gibt es hier nur eine feste,
// konfigurierte Zieladresse statt eines individuellen Kontos.
export async function sendAdminPendingBookingApprovalEmail({
  guestName,
  facilityName,
  bookingType,
}: {
  guestName: string;
  facilityName: string;
  bookingType: string;
}) {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!to) {
    // Wie bei fehlendem RESEND_API_KEY: kein Hard-Fail, nur ein Log - die
    // Buchung selbst darf davon nicht abhängen.
    console.error(
      "ADMIN_NOTIFICATION_EMAIL is not set - skipping admin booking approval notification",
    );
    return;
  }
  const bookingTypeLabel = bookingTypeLabels[bookingType] ?? bookingType;
  const dashboardUrl = `${appUrl()}/admin/dashboard`;

  await sendEmail({
    to,
    subject: `Buchung wartet auf Freigabe: ${bookingTypeLabel} bei ${facilityName}`,
    html: `
      ${logoHtml()}
      <p>Eine Buchung von einem bevollmächtigten Account wartet auf die woodaa-Freigabe:</p>
      <ul>
        <li>Einrichtung: ${facilityName}</li>
        <li>Leistung: ${bookingTypeLabel}</li>
        <li>Versicherte Person: ${guestName}</li>
      </ul>
      <p>Freigeben oder ablehnen im Admin-Dashboard: <a href="${dashboardUrl}">${dashboardUrl}</a></p>
    `,
    text: `Eine Buchung von einem bevollmächtigten Account wartet auf die woodaa-Freigabe:

Einrichtung: ${facilityName}
Leistung: ${bookingTypeLabel}
Versicherte Person: ${guestName}

Freigeben oder ablehnen im Admin-Dashboard: ${dashboardUrl}`,
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
