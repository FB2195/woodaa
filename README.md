# woodaa

woodaa ist eine Buchungsplattform für Pflegeplätze in Deutschland – gedacht
als Booking.com-Äquivalent für Pflegeheime. Angehörige und Betroffene finden
und buchen einen Platz für **stationäre Aufnahme (Dauerpflege)**,
**Kurzzeitpflege** oder **Tages-/Nachtpflege**; Pflegeeinrichtungen verwalten
ihre Einrichtung, Verfügbarkeit und Buchungsanfragen selbst über ein eigenes
Betreiber-Portal.

## Architektur

Monorepo verwaltet mit **pnpm workspaces** + **Turborepo**.

```
apps/
  web/       Next.js 15 – öffentliche Suche/Buchung + Betreiber-Web-Dashboard
  mobile/    Expo (React Native) – App für Suchende
  api/       Fastify + tRPC – Backend, Auth, Webhooks
packages/
  db/          Prisma-Schema, Migrationen, DB-Client
  api/          tRPC-Router & Business-Logik (framework-agnostisch)
  validators/    Geteilte Zod-Schemas & Enums (BookingType, Role, ...)
  ui/              Design-Tokens (Farben etc.), geteilte UI-Bausteine
  config/           eslint-, tsconfig-, tailwind-Basiskonfiguration
```

Web und Mobile teilen sich Design-Tokens (`packages/ui`) und Validierungs-
Schemas (`packages/validators`); Web/Mobile importieren vom Backend nur den
`AppRouter`-**Typ** (tRPC) für durchgängige Typsicherheit – ganz ohne
Code-Generierung.

### Tech-Stack

| Bereich       | Wahl                                              |
|---------------|-----------------------------------------------------|
| Web           | Next.js 15 (App Router), TypeScript, Tailwind, shadcn/ui |
| Mobile        | Expo (React Native), NativeWind                   |
| Backend       | Fastify + tRPC                                     |
| Datenbank     | PostgreSQL (Neon, EU/Frankfurt) via Prisma          |
| Object Storage| Cloudflare R2 (Fotos, Verifizierungsdokumente)      |
| Auth          | Eigenes JWT-Auth (Backend-seitig, für Web & Mobile) |
| Payments      | Stripe Connect (ab Phase 3)                          |
| Hosting       | Vercel (Web), Expo EAS (Mobile), Railway (API)        |

## Marke

Farbpalette: Grün / Olivgrün / Weiß. Siehe `packages/ui/src/tokens.ts`.
Logo folgt.

## Roadmap

- **Phase 0 (aktuell):** Monorepo-Grundgerüst, alle Apps starten lauffähig.
- **Phase 1:** Datenmodell, Self-Service-Betreiber-Onboarding, Suche/Browse,
  anfragebasierte Buchung (ohne Bezahlung).
- **Phase 2:** Echte Verfügbarkeitskalender für alle drei Buchungsarten,
  Buchungs-Workflow, Benachrichtigungen.
- **Phase 3:** Stripe Connect, Provisionsmodell, Auszahlungen.
- **Phase 4:** Nachrichten, Bewertungen, Kartenansicht, Feinschliff.
- **Phase 5:** Mobile Feature-Parität, App Store & Play Store Launch.

## Lokale Entwicklung

Voraussetzungen: Node.js ≥ 20, pnpm ≥ 9, eine PostgreSQL-Datenbank.

```bash
pnpm install
cp .env.example .env   # Werte anpassen (v.a. DATABASE_URL)
pnpm db:generate
pnpm db:migrate
pnpm dev                # startet web, mobile und api parallel (Turborepo)
```

Einzeln starten:

```bash
pnpm --filter web dev      # Next.js unter http://localhost:3000
pnpm --filter api dev      # Fastify unter http://localhost:4000
pnpm --filter mobile start # Expo Dev Server (Expo Go scannen)
```
