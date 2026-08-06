"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GESETZLICHE_VERSICHERUNGSNUMMER_REGEX, type Pflegegrad } from "@woodaa/validators";
import { establishSession, redirectFor } from "@/lib/authSession";
import { GESETZLICHE_KRANKENKASSEN } from "@/lib/krankenkassen";
import { pflegegradOptions } from "@/lib/pflegegradLabels";
import { trpc } from "@/lib/trpc";

const ANDERE_KASSE = "Andere gesetzliche Krankenkasse";

export function RegisterSuchendeForm() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [error, setError] = useState<string | null>(null);
  const [pflegegrad, setPflegegrad] = useState<Pflegegrad | "">("");
  const [hatBevollmaechtigten, setHatBevollmaechtigten] = useState(false);
  const [krankenkasseArt, setKrankenkasseArt] = useState<"GESETZLICH" | "PRIVAT" | "">("");
  const [gesetzlicheKasse, setGesetzlicheKasse] = useState("");
  const register = trpc.auth.register.useMutation();

  const pflegegradAntragLabel =
    pflegegrad === "" || pflegegrad === 0
      ? "Pflegegrad bereits beantragt"
      : "Erhöhung des Pflegegrades beantragt";

  return (
    <form
      className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        const form = new FormData(event.currentTarget);
        const get = (name: string) => String(form.get(name) ?? "").trim();

        const krankenkasse =
          krankenkasseArt === "PRIVAT"
            ? get("krankenkassePrivatName")
            : gesetzlicheKasse === ANDERE_KASSE
              ? get("krankenkasseAndere")
              : gesetzlicheKasse;

        // Guarded by the <select required>/radio required above - pflegegrad
        // and krankenkasseArt can't actually be "" once the browser lets the
        // form submit.
        if (pflegegrad === "") {
          setError("Bitte wähle einen Pflegegrad aus.");
          return;
        }
        if (krankenkasseArt === "") {
          setError("Bitte wähle gesetzlich oder privat versichert aus.");
          return;
        }

        const versicherungsnummer = get("versicherungsnummer");
        if (
          krankenkasseArt === "GESETZLICH" &&
          !GESETZLICHE_VERSICHERUNGSNUMMER_REGEX.test(versicherungsnummer)
        ) {
          setError(
            "Das sieht nicht nach einer gültigen Versichertennummer aus - sie besteht aus " +
              "einem Buchstaben gefolgt von 9 Ziffern (z. B. A123456789) und steht auf der " +
              "Vorderseite deiner Versichertenkarte.",
          );
          return;
        }

        try {
          const result = await register.mutateAsync({
            role: "SUCHENDE",
            vorname: get("vorname"),
            nachname: get("nachname"),
            email: get("email"),
            password: get("password"),
            geburtsdatum: get("geburtsdatum"),
            street: get("street"),
            postalCode: get("postalCode"),
            city: get("city"),
            phone: get("phone") || undefined,
            pflegegrad,
            pflegegradAntragLaeuft: form.get("pflegegradAntragLaeuft") === "on",
            krankenkasseArt,
            krankenkasse,
            versicherungsnummer,
            hatBevollmaechtigten,
            bevollmaechtigterVorname: hatBevollmaechtigten
              ? get("bevollmaechtigterVorname")
              : undefined,
            bevollmaechtigterNachname: hatBevollmaechtigten
              ? get("bevollmaechtigterNachname")
              : undefined,
            bevollmaechtigterAdresse: hatBevollmaechtigten
              ? get("bevollmaechtigterAdresse")
              : undefined,
            bevollmaechtigterTelefon: hatBevollmaechtigten
              ? get("bevollmaechtigterTelefon")
              : undefined,
            bevollmaechtigterEmail: hatBevollmaechtigten
              ? get("bevollmaechtigterEmail")
              : undefined,
            newsletterOptIn: form.get("newsletterOptIn") === "on",
            agbAccepted: true,
            datenschutzAccepted: true,
          });
          await establishSession(result);
          await utils.invalidate();
          router.push(redirectFor(result.user.role));
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
        }
      }}
    >
      <h1 className="text-lg font-semibold text-brand-heading">Konto erstellen</h1>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Vorname
          <input
            name="vorname"
            autoComplete="given-name"
            required
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Nachname
          <input
            name="nachname"
            autoComplete="family-name"
            required
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Geburtsdatum
        <input
          type="date"
          name="geburtsdatum"
          autoComplete="bday"
          required
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Straße & Hausnummer
        <input
          name="street"
          autoComplete="street-address"
          required
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          PLZ
          <input
            name="postalCode"
            autoComplete="postal-code"
            required
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Ort
          <input
            name="city"
            autoComplete="address-level2"
            required
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Telefonnummer (optional)
        <input
          type="tel"
          name="phone"
          autoComplete="tel"
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        E-Mail
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Passwort
        <input
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <div className="border-t border-brand-border pt-4">
        <p className="text-sm font-medium text-brand-text">Pflegegrad</p>
      </div>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Pflegegrad
        <select
          name="pflegegrad"
          required
          value={pflegegrad}
          onChange={(event) =>
            setPflegegrad(
              event.target.value === "" ? "" : (Number(event.target.value) as Pflegegrad),
            )
          }
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        >
          <option value="">Bitte wählen</option>
          {pflegegradOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-brand-text">
        <input type="checkbox" name="pflegegradAntragLaeuft" />
        {pflegegradAntragLabel}
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm text-brand-text">Krankenversicherung</legend>
        <label className="flex items-center gap-2 text-sm text-brand-text">
          <input
            type="radio"
            name="krankenkasseArt"
            required
            checked={krankenkasseArt === "GESETZLICH"}
            onChange={() => setKrankenkasseArt("GESETZLICH")}
          />
          Gesetzliche Krankenkasse
        </label>
        <label className="flex items-center gap-2 text-sm text-brand-text">
          <input
            type="radio"
            name="krankenkasseArt"
            required
            checked={krankenkasseArt === "PRIVAT"}
            onChange={() => setKrankenkasseArt("PRIVAT")}
          />
          Private Krankenversicherung
        </label>
      </fieldset>

      {krankenkasseArt === "GESETZLICH" && (
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Krankenkasse
          <select
            required
            value={gesetzlicheKasse}
            onChange={(event) => setGesetzlicheKasse(event.target.value)}
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          >
            <option value="">Bitte wählen</option>
            {GESETZLICHE_KRANKENKASSEN.map((kasse) => (
              <option key={kasse} value={kasse}>
                {kasse}
              </option>
            ))}
          </select>
        </label>
      )}

      {krankenkasseArt === "GESETZLICH" && gesetzlicheKasse === ANDERE_KASSE && (
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Name der Krankenkasse
          <input
            name="krankenkasseAndere"
            required
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
      )}

      {krankenkasseArt === "PRIVAT" && (
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Name der privaten Krankenversicherung
          <input
            name="krankenkassePrivatName"
            required
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
      )}

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Versicherungsnummer
        <input
          name="versicherungsnummer"
          required
          placeholder={krankenkasseArt === "GESETZLICH" ? "z. B. A123456789" : undefined}
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
        <span className="text-xs text-brand-text-muted">
          Du findest sie auf der Vorderseite deiner Versichertenkarte.
        </span>
      </label>

      <div className="border-t border-brand-border pt-4">
        <label className="flex items-center gap-2 text-sm text-brand-text">
          <input
            type="checkbox"
            checked={hatBevollmaechtigten}
            onChange={(event) => setHatBevollmaechtigten(event.target.checked)}
          />
          Ich habe eine/n Bevollmächtigte/n
        </label>
      </div>

      {hatBevollmaechtigten && (
        <div className="flex flex-col gap-4 rounded-brand-md border border-brand-border bg-brand-background p-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm text-brand-text">
              Vorname
              <input
                name="bevollmaechtigterVorname"
                required={hatBevollmaechtigten}
                className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-brand-text">
              Nachname
              <input
                name="bevollmaechtigterNachname"
                required={hatBevollmaechtigten}
                className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm text-brand-text">
            Adresse
            <input
              name="bevollmaechtigterAdresse"
              required={hatBevollmaechtigten}
              placeholder="Straße, PLZ, Ort"
              className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-brand-text">
            Telefonnummer
            <input
              type="tel"
              name="bevollmaechtigterTelefon"
              required={hatBevollmaechtigten}
              className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-brand-text">
            E-Mail
            <input
              type="email"
              name="bevollmaechtigterEmail"
              required={hatBevollmaechtigten}
              className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-brand-border pt-4">
        <label className="flex items-center gap-2 text-sm text-brand-text">
          <input type="checkbox" name="newsletterOptIn" />
          Ich möchte News und Angebote von woodaa per E-Mail erhalten
        </label>
        <label className="flex items-center gap-2 text-sm text-brand-text">
          <input type="checkbox" name="agb" required />
          Ich akzeptiere die{" "}
          <Link href="/nutzungsbedingungen" className="text-brand-accent underline">
            Nutzungsbedingungen
          </Link>
        </label>
        <label className="flex items-center gap-2 text-sm text-brand-text">
          <input type="checkbox" name="datenschutz" required />
          Ich habe die{" "}
          <Link href="/datenschutz" className="text-brand-accent underline">
            Datenschutzerklärung
          </Link>{" "}
          gelesen
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={register.isPending}
        className="rounded-brand-md bg-brand-accent px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {register.isPending ? "Einen Moment…" : "Konto erstellen"}
      </button>
    </form>
  );
}
