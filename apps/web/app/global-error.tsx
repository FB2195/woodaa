"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Next.js only calls this for an error that escapes every other error
// boundary (it replaces the entire root layout, so no Tailwind/global.css
// guaranteed - plain inline styles only). There was no error boundary of
// any kind before this, so an uncaught render crash showed Next's bare
// default error screen with nothing reported anywhere.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="de">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1.5rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Da ist etwas schiefgelaufen</h1>
        <p style={{ color: "#6B6F62", maxWidth: "28rem" }}>
          Bitte lade die Seite neu. Falls das Problem bestehen bleibt, kontaktiere gerne unseren
          Kundenservice.
        </p>
      </body>
    </html>
  );
}
