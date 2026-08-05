import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { BookingType } from "@woodaa/validators";

const bookingTypeLabels: Record<BookingType, string> = {
  STATIONAERE_AUFNAHME: "Vollstationäre Pflege",
  KURZZEITPFLEGE: "Kurzzeitpflege",
  TAGESPFLEGE: "Tagespflege",
  NACHTPFLEGE: "Nachtpflege",
};

export async function generateCareApplicationPdf(input: {
  applicantName: string;
  applicantEmail: string;
  versicherungsnummer: string;
  pflegegrad: number | null;
  bookingType: BookingType;
  signatureName: string;
  submittedAt: Date;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 56;
  let y = 780;
  const lineGap = 22;

  const drawLabelValue = (label: string, value: string) => {
    page.drawText(label, { x: margin, y, size: 11, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(value, { x: margin + 200, y, size: 11, font, color: rgb(0.1, 0.1, 0.1) });
    y -= lineGap;
  };

  page.drawText("Antrag auf Kostenübernahme", {
    x: margin,
    y,
    size: 18,
    font: boldFont,
    color: rgb(0.16, 0.32, 0.2),
  });
  y -= 32;

  page.drawText(bookingTypeLabels[input.bookingType], {
    x: margin,
    y,
    size: 13,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 40;

  drawLabelValue("Versicherte Person:", input.applicantName);
  drawLabelValue("E-Mail:", input.applicantEmail);
  drawLabelValue("Versicherungsnummer:", input.versicherungsnummer);
  drawLabelValue(
    "Aktueller Pflegegrad:",
    input.pflegegrad !== null ? String(input.pflegegrad) : "noch nicht festgestellt",
  );
  drawLabelValue("Beantragte Leistung:", bookingTypeLabels[input.bookingType]);
  drawLabelValue(
    "Eingereicht am:",
    new Intl.DateTimeFormat("de-DE", { dateStyle: "long", timeStyle: "short" }).format(
      input.submittedAt,
    ),
  );

  y -= 30;
  const declaration =
    `Ich beantrage hiermit die Kostenübernahme für ${bookingTypeLabels[input.bookingType]}. ` +
    "Die vorstehenden Angaben wurden von mir digital über die Plattform woodaa (woodaa.de) erfasst " +
    "und bestätigt.";
  const words = declaration.split(" ");
  const maxWidth = 595.28 - margin * 2;
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, 11) > maxWidth) {
      page.drawText(line, { x: margin, y, size: 11, font, color: rgb(0.1, 0.1, 0.1) });
      y -= 16;
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) {
    page.drawText(line, { x: margin, y, size: 11, font, color: rgb(0.1, 0.1, 0.1) });
    y -= 16;
  }

  y -= 40;
  page.drawText("Digitale Signatur:", { x: margin, y, size: 11, font: boldFont });
  y -= 24;
  page.drawText(input.signatureName, {
    x: margin,
    y,
    size: 16,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawLine({
    start: { x: margin, y: y - 6 },
    end: { x: margin + 250, y: y - 6 },
    thickness: 0.5,
    color: rgb(0.6, 0.6, 0.6),
  });

  return pdfDoc.save();
}
