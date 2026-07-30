import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Woodaa – Pflegeplätze finden und buchen",
  description:
    "Woodaa verbindet Familien mit Pflegeeinrichtungen: stationäre Aufnahme, Kurzzeitpflege und Tages-/Nachtpflege in Deutschland finden und anfragen.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
