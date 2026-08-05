import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "woodaa – Pflegeplätze finden und buchen",
  description:
    "woodaa verbindet Familien mit Pflegeeinrichtungen: stationäre Aufnahme, Kurzzeitpflege und Tages-/Nachtpflege in Deutschland finden und anfragen.",
};

// Runs before hydration so the correct theme class is on <html> for the
// very first paint - avoids a light->dark flash. Mirrors the cookie/
// prefers-color-scheme fallback logic in ThemeProvider; kept as a plain
// string (not an imported function) since Next.js inlines this verbatim
// into a blocking <script> tag rather than executing it as a module.
const themeInitScript = `(function() {
  try {
    var match = document.cookie.match(/(?:^|; )woodaa_theme=([^;]+)/);
    var stored = match ? match[1] : null;
    var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
