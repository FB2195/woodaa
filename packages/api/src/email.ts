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

// Every value that ends up inside an `html:` template below and didn't
// originate from a fixed lookup table (bookingTypeLabels, ...) or an
// already-sanitized slug/URL must go through this first - names, emails and
// facility/guest-supplied text are otherwise interpolated as raw HTML into
// mail sent from woodaa's own domain. Only for the `html:` variant; the
// `text:` sibling of every email uses the unescaped value as-is.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
  const safeName = escapeHtml(name);

  await sendEmail({
    to,
    subject: "Bitte bestätige deine E-Mail-Adresse bei woodaa",
    html: `
      ${logoHtml()}
      <p>Hallo ${safeName},</p>
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
  const safeName = escapeHtml(name);

  await sendEmail({
    to,
    subject: "Passwort zurücksetzen bei woodaa",
    html: `
      ${logoHtml()}
      <p>Hallo ${safeName},</p>
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
  const safeName = escapeHtml(name);
  const safeNewEmail = escapeHtml(newEmail);

  await sendEmail({
    to,
    subject: "Bestätige die Änderung deiner E-Mail-Adresse bei woodaa",
    html: `
      ${logoHtml()}
      <p>Hallo ${safeName},</p>
      <p>du hast angefordert, deine E-Mail-Adresse bei woodaa auf <strong>${safeNewEmail}</strong> zu ändern:</p>
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
  const safeName = escapeHtml(name);

  await sendEmail({
    to,
    subject: "Bestätige deine neue E-Mail-Adresse bei woodaa",
    html: `
      ${logoHtml()}
      <p>Hallo ${safeName},</p>
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
  const safeRecipientName = escapeHtml(recipientName);
  const safeGuestName = escapeHtml(guestName);
  const safeFacilityName = escapeHtml(facilityName);

  await sendEmail({
    to,
    subject: `Buchungsbestätigung: ${bookingTypeLabel} bei ${facilityName}`,
    html: `
      ${logoHtml()}
      <p>Hallo ${safeRecipientName},</p>
      <p>vielen Dank für die Buchung über woodaa. Wir haben deine Anfrage erhalten:</p>
      <ul>
        <li>Einrichtung: <a href="${facilityUrl}">${safeFacilityName}</a></li>
        <li>Leistung: ${bookingTypeLabel}</li>
        <li>Versicherte Person: ${safeGuestName}</li>
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

  const safeFacilityName = escapeHtml(facilityName);
  const safeGuestName = escapeHtml(guestName);
  const safeRecipientName = escapeHtml(recipientName);

  const rejectionReasonSentence: Record<"EINRICHTUNG" | "ZAHLUNG" | "WOODAA", string> = {
    EINRICHTUNG: `<strong>${safeFacilityName}</strong> konnte deine Buchung (${bookingTypeLabel} für ${safeGuestName}) leider nicht annehmen.`,
    ZAHLUNG: `<strong>${safeFacilityName}</strong> hat die gewählte Zahlungsart für deine Buchung (${bookingTypeLabel} für ${safeGuestName}) leider nicht freigegeben.`,
    WOODAA: `woodaa konnte deine Buchung (${bookingTypeLabel} für ${safeGuestName}) bei <strong>${safeFacilityName}</strong> leider nicht freigeben.`,
  };
  const rejectionReasonSentenceText: Record<"EINRICHTUNG" | "ZAHLUNG" | "WOODAA", string> = {
    EINRICHTUNG: `${facilityName} konnte deine Buchung (${bookingTypeLabel} für ${guestName}) leider nicht annehmen.`,
    ZAHLUNG: `${facilityName} hat die gewählte Zahlungsart für deine Buchung (${bookingTypeLabel} für ${guestName}) leider nicht freigegeben.`,
    WOODAA: `woodaa konnte deine Buchung (${bookingTypeLabel} für ${guestName}) bei ${facilityName} leider nicht freigeben.`,
  };

  const bodyHtml =
    decision === "BESTAETIGT"
      ? `<p><strong>${safeFacilityName}</strong> hat deine Buchung (${bookingTypeLabel} für ${safeGuestName}) bestätigt.</p>`
      : decision === "ABGELEHNT"
        ? `<p>${rejectionReasonSentence[rejectionSource]} Die Buchung wurde storniert, eine eventuell bereits erfolgte Zahlung wird automatisch erstattet.</p>`
        : `<p>Die Zahlung für deine Buchung (${bookingTypeLabel} für ${safeGuestName}) bei <strong>${safeFacilityName}</strong> konnte nicht abgeschlossen werden. Die Buchung wurde storniert und der Platz wieder freigegeben. Du kannst gerne erneut buchen, sobald das Zahlungsproblem behoben ist.</p>`;

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
      <p>Hallo ${safeRecipientName},</p>
      ${bodyHtml}
      <p>Einrichtung: <a href="${facilityUrl}">${safeFacilityName}</a></p>
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
  const safeOperatorName = escapeHtml(operatorName);
  const safeGuestName = escapeHtml(guestName);
  const safeFacilityName = escapeHtml(facilityName);

  await sendEmail({
    to,
    subject: `Neue Buchung bei ${facilityName}: ${bookingTypeLabel}`,
    html: `
      ${logoHtml()}
      <p>Hallo ${safeOperatorName},</p>
      <p>bei <strong>${safeFacilityName}</strong> ist eine neue Buchung eingegangen:</p>
      <ul>
        <li>Leistung: ${bookingTypeLabel}</li>
        <li>Versicherte Person: ${safeGuestName}</li>
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

// bookingRequest.create - an unverbindliche Anfrage (kein Login, keine
// Zahlung), im Unterschied zu sendOperatorNewBookingEmail für eine
// verbindliche Buchung. Ohne diese Mail hätte der Betreiber keine
// Möglichkeit zu erfahren, dass überhaupt eine Anfrage eingegangen ist.
export async function sendOperatorNewBookingRequestEmail({
  to,
  operatorName,
  requesterName,
  facilityName,
  bookingType,
}: {
  to: string;
  operatorName: string;
  requesterName: string;
  facilityName: string;
  bookingType: string;
}) {
  const bookingTypeLabel = bookingTypeLabels[bookingType] ?? bookingType;
  const dashboardUrl = `${appUrl()}/betreiber/dashboard`;
  const safeOperatorName = escapeHtml(operatorName);
  const safeRequesterName = escapeHtml(requesterName);
  const safeFacilityName = escapeHtml(facilityName);

  await sendEmail({
    to,
    subject: `Neue Anfrage bei ${facilityName}: ${bookingTypeLabel}`,
    html: `
      ${logoHtml()}
      <p>Hallo ${safeOperatorName},</p>
      <p>bei <strong>${safeFacilityName}</strong> ist eine unverbindliche Anfrage eingegangen:</p>
      <ul>
        <li>Leistung: ${bookingTypeLabel}</li>
        <li>Von: ${safeRequesterName}</li>
      </ul>
      <p>Details und Kontaktdaten findest du in deinem woodaa-Dashboard:
      <a href="${dashboardUrl}">${dashboardUrl}</a></p>
    `,
    text: `Hallo ${operatorName},

bei ${facilityName} ist eine unverbindliche Anfrage eingegangen:

Leistung: ${bookingTypeLabel}
Von: ${requesterName}

Details und Kontaktdaten findest du in deinem woodaa-Dashboard: ${dashboardUrl}`,
  });
}

// Nachfass-Mail, falls eine Anfrage nach REMINDER_AFTER_HOURS (siehe
// approvalEscalation.ts) immer noch auf status=OFFEN steht.
export async function sendOperatorBookingRequestReminderEmail({
  to,
  operatorName,
  requesterName,
  facilityName,
  bookingType,
}: {
  to: string;
  operatorName: string;
  requesterName: string;
  facilityName: string;
  bookingType: string;
}) {
  const bookingTypeLabel = bookingTypeLabels[bookingType] ?? bookingType;
  const dashboardUrl = `${appUrl()}/betreiber/dashboard`;
  const safeOperatorName = escapeHtml(operatorName);
  const safeRequesterName = escapeHtml(requesterName);
  const safeFacilityName = escapeHtml(facilityName);

  await sendEmail({
    to,
    subject: `Erinnerung: Anfrage bei ${facilityName} wartet noch auf eine Antwort`,
    html: `
      ${logoHtml()}
      <p>Hallo ${safeOperatorName},</p>
      <p>eine Anfrage bei <strong>${safeFacilityName}</strong> wartet weiterhin auf eine Antwort:</p>
      <ul>
        <li>Leistung: ${bookingTypeLabel}</li>
        <li>Von: ${safeRequesterName}</li>
      </ul>
      <p>Bitte melde dich zeitnah - Familien in dieser Situation entscheiden sich oft für die
      Einrichtung, die zuerst antwortet. Details in deinem woodaa-Dashboard:
      <a href="${dashboardUrl}">${dashboardUrl}</a></p>
    `,
    text: `Hallo ${operatorName},

eine Anfrage bei ${facilityName} wartet weiterhin auf eine Antwort:

Leistung: ${bookingTypeLabel}
Von: ${requesterName}

Bitte melde dich zeitnah - Familien in dieser Situation entscheiden sich oft für die Einrichtung, die zuerst antwortet. Details in deinem woodaa-Dashboard: ${dashboardUrl}`,
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
  const safeGuestName = escapeHtml(guestName);
  const safeFacilityName = escapeHtml(facilityName);

  await sendEmail({
    to,
    subject: `Buchung wartet auf Freigabe: ${bookingTypeLabel} bei ${facilityName}`,
    html: `
      ${logoHtml()}
      <p>Eine Buchung von einem bevollmächtigten Account wartet auf die woodaa-Freigabe:</p>
      <ul>
        <li>Einrichtung: ${safeFacilityName}</li>
        <li>Leistung: ${bookingTypeLabel}</li>
        <li>Versicherte Person: ${safeGuestName}</li>
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
  const safeApplicantName = escapeHtml(applicantName);
  const safeVersicherungsnummer = escapeHtml(versicherungsnummer);

  await sendEmail({
    to,
    subject,
    html: `
      <p>Antrag auf Kostenübernahme für <strong>${bookingTypeLabel}</strong></p>
      <p>Versicherte Person: ${safeApplicantName}<br />Versicherungsnummer: ${safeVersicherungsnummer}</p>
      <p>Digital eingereicht über woodaa (woodaa.de). Siehe angehängtes PDF für die vollständigen Angaben und die digitale Signatur.</p>
    `,
    text: `Antrag auf Kostenübernahme für ${bookingTypeLabel}

Versicherte Person: ${applicantName}
Versicherungsnummer: ${versicherungsnummer}

Digital eingereicht über woodaa (woodaa.de). Siehe angehängtes PDF für die vollständigen Angaben und die digitale Signatur.`,
    attachments: [{ filename: `antrag-${fileSlug}.pdf`, content }],
  });
}

// Sent by notifyWaitlist (availability.ts) once a spot opens up for a
// facility/bookingType a WaitlistEntry is waiting on - first-come-first-
// served, no reservation is held, so the wording is deliberately clear that
// this is a "go book now" nudge, not a confirmed place.
export async function sendWaitlistSpotAvailableEmail({
  to,
  name,
  facilityName,
  facilitySlug,
  bookingType,
}: {
  to: string;
  name: string;
  facilityName: string;
  facilitySlug: string;
  bookingType: string;
}) {
  const bookingTypeLabel = bookingTypeLabels[bookingType] ?? bookingType;
  const facilityUrl = `${appUrl()}/einrichtung/${facilitySlug}`;
  const safeName = escapeHtml(name);
  const safeFacilityName = escapeHtml(facilityName);

  await sendEmail({
    to,
    subject: `Ein Platz ist frei geworden bei ${facilityName}`,
    html: `
      ${logoHtml()}
      <p>Hallo ${safeName},</p>
      <p>gute Nachrichten: bei <a href="${facilityUrl}">${safeFacilityName}</a> ist gerade ein Platz für
      ${bookingTypeLabel} frei geworden - du standest dafür auf der Warteliste.</p>
      <p>Der Platz ist nicht für dich reserviert und kann jederzeit anderweitig vergeben werden -
      am besten buchst oder fragst du zeitnah direkt an.</p>
      <p><a href="${facilityUrl}">${facilityUrl}</a></p>
    `,
    text: `Hallo ${name},

gute Nachrichten: bei ${facilityName} (${facilityUrl}) ist gerade ein Platz für ${bookingTypeLabel} frei geworden - du standest dafür auf der Warteliste.

Der Platz ist nicht für dich reserviert und kann jederzeit anderweitig vergeben werden - am besten buchst oder fragst du zeitnah direkt an.

${facilityUrl}`,
  });
}

// Sent by checkSavedSearchAlerts (savedSearchAlerts.ts) when a SavedSearch
// has one or more facilities that newly match since the last hourly check -
// see the comment on SavedSearch in schema.prisma for why only *new*
// matches (not the full current result set) trigger this each run.
export async function sendSavedSearchMatchEmail({
  to,
  recipientName,
  city,
  facilities,
}: {
  to: string;
  recipientName: string;
  city: string;
  facilities: { name: string; slug: string }[];
}) {
  const safeRecipientName = escapeHtml(recipientName);
  const safeCity = escapeHtml(city);
  const searchUrl = `${appUrl()}/suche?city=${encodeURIComponent(city)}`;

  const itemsHtml = facilities
    .map((f) => {
      const url = `${appUrl()}/einrichtung/${f.slug}`;
      return `<li><a href="${url}">${escapeHtml(f.name)}</a></li>`;
    })
    .join("\n");
  const itemsText = facilities
    .map((f) => `- ${f.name}: ${appUrl()}/einrichtung/${f.slug}`)
    .join("\n");

  const subject =
    facilities.length === 1
      ? `Neuer freier Platz in ${city}: ${facilities[0]!.name}`
      : `${facilities.length} neue Einrichtungen mit freiem Platz in ${city}`;

  await sendEmail({
    to,
    subject,
    html: `
      ${logoHtml()}
      <p>Hallo ${safeRecipientName},</p>
      <p>für deine gespeicherte Suche in <strong>${safeCity}</strong> gibt es Neuigkeiten - diese
      Einrichtung${facilities.length > 1 ? "en haben" : " hat"} jetzt einen freien Platz:</p>
      <ul>${itemsHtml}</ul>
      <p>Alle Treffer für diese Suche: <a href="${searchUrl}">${searchUrl}</a></p>
      <p>Gespeicherte Suchen verwaltest du in deinem woodaa-Konto.</p>
    `,
    text: `Hallo ${recipientName},

für deine gespeicherte Suche in ${city} gibt es Neuigkeiten - diese Einrichtung${facilities.length > 1 ? "en haben" : " hat"} jetzt einen freien Platz:

${itemsText}

Alle Treffer für diese Suche: ${searchUrl}

Gespeicherte Suchen verwaltest du in deinem woodaa-Konto.`,
  });
}

// message.send - a searching user asked a facility a question (or followed
// up on an existing thread). Only sent to facility.operator's own login
// email (same as sendOperatorNewBookingEmail), so silently skipped by the
// caller for facilities without a linked operator account.
export async function sendOperatorNewMessageEmail({
  to,
  operatorName,
  senderName,
  facilityName,
  body,
}: {
  to: string;
  operatorName: string;
  senderName: string;
  facilityName: string;
  body: string;
}) {
  const dashboardUrl = `${appUrl()}/betreiber/dashboard`;
  const safeOperatorName = escapeHtml(operatorName);
  const safeSenderName = escapeHtml(senderName);
  const safeFacilityName = escapeHtml(facilityName);
  const safeBody = escapeHtml(body).replace(/\n/g, "<br />");

  await sendEmail({
    to,
    subject: `Neue Nachricht von ${senderName} zu ${facilityName}`,
    html: `
      ${logoHtml()}
      <p>Hallo ${safeOperatorName},</p>
      <p><strong>${safeSenderName}</strong> hat dir über woodaa eine Nachricht zu
      <strong>${safeFacilityName}</strong> geschickt:</p>
      <blockquote style="margin:0;padding:12px 16px;border-left:3px solid #ccc;color:#333">${safeBody}</blockquote>
      <p>Antworten kannst du direkt in deinem woodaa-Dashboard: <a href="${dashboardUrl}">${dashboardUrl}</a></p>
    `,
    text: `Hallo ${operatorName},

${senderName} hat dir über woodaa eine Nachricht zu ${facilityName} geschickt:

"${body}"

Antworten kannst du direkt in deinem woodaa-Dashboard: ${dashboardUrl}`,
  });
}

// operator.replyToConversation - the facility answered a question. Push
// (see sendPushNotification) covers mobile app users; this covers everyone
// else (and doubles as a record in the user's inbox for app users too).
export async function sendUserNewMessageEmail({
  to,
  recipientName,
  facilityName,
  facilitySlug,
  body,
}: {
  to: string;
  recipientName: string;
  facilityName: string;
  facilitySlug: string;
  body: string;
}) {
  const conversationUrl = `${appUrl()}/einrichtung/${facilitySlug}`;
  const safeRecipientName = escapeHtml(recipientName);
  const safeFacilityName = escapeHtml(facilityName);
  const safeBody = escapeHtml(body).replace(/\n/g, "<br />");

  await sendEmail({
    to,
    subject: `Neue Antwort von ${facilityName}`,
    html: `
      ${logoHtml()}
      <p>Hallo ${safeRecipientName},</p>
      <p><strong>${safeFacilityName}</strong> hat dir über woodaa geantwortet:</p>
      <blockquote style="margin:0;padding:12px 16px;border-left:3px solid #ccc;color:#333">${safeBody}</blockquote>
      <p>Die ganze Unterhaltung findest du in deinem woodaa-Konto: <a href="${conversationUrl}">${conversationUrl}</a></p>
    `,
    text: `Hallo ${recipientName},

${facilityName} hat dir über woodaa geantwortet:

"${body}"

Die ganze Unterhaltung findest du in deinem woodaa-Konto: ${conversationUrl}`,
  });
}
