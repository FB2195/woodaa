import type { BookingType } from "@woodaa/validators";
import { useState } from "react";
import { Dialog } from "../Dialog";
import { Field, SelectFieldInput, TextField } from "../Field";
import { bookingTypeLabels, dateRangedBookingTypes } from "../../lib/bookingTypeLabels";
import { trpc } from "../../lib/trpc";

const sourceLabels = { TELEFON: "Telefon", VOR_ORT: "Vor Ort" } as const;

export function ManualBookingDialog({
  bookingType,
  onClose,
}: {
  bookingType: BookingType;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const createBooking = trpc.operator.createManualBooking.useMutation({
    onSuccess: () => {
      utils.operator.myFacility.invalidate();
      onClose();
    },
  });

  const [source, setSource] = useState<"TELEFON" | "VOR_ORT">("TELEFON");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isDateRanged = dateRangedBookingTypes.includes(bookingType);

  return (
    <Dialog title={`Buchung erfassen · ${bookingTypeLabels[bookingType]}`} onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          if (isDateRanged && (!startDate || !endDate)) {
            setError("Bitte Start- und Enddatum angeben.");
            return;
          }
          try {
            await createBooking.mutateAsync({
              bookingType,
              source,
              guestName: guestName.trim(),
              guestEmail: guestEmail.trim() || undefined,
              guestPhone: guestPhone.trim() || undefined,
              note: note.trim() || undefined,
              startDate: isDateRanged ? new Date(startDate).toISOString() : undefined,
              endDate: isDateRanged ? new Date(endDate).toISOString() : undefined,
            });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
          }
        }}
      >
        <Field label="Erfasst über">
          <SelectFieldInput
            value={source}
            onChange={(event) => setSource(event.target.value as "TELEFON" | "VOR_ORT")}
          >
            {Object.entries(sourceLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectFieldInput>
        </Field>

        <Field label="Name">
          <TextField
            required
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
          />
        </Field>

        {isDateRanged && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Von">
              <TextField
                type="date"
                required
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </Field>
            <Field label="Bis">
              <TextField
                type="date"
                required
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </Field>
          </div>
        )}

        <Field label="E-Mail (optional)">
          <TextField
            type="email"
            value={guestEmail}
            onChange={(event) => setGuestEmail(event.target.value)}
          />
        </Field>
        <Field label="Telefon (optional)">
          <TextField
            type="tel"
            value={guestPhone}
            onChange={(event) => setGuestPhone(event.target.value)}
          />
        </Field>
        <Field label="Notiz (optional)">
          <TextField value={note} onChange={(event) => setNote(event.target.value)} />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={createBooking.isPending}
          className="rounded-xl2 bg-accentScale-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-250 ease-out-quart hover:bg-accentScale-600 disabled:opacity-50"
        >
          {createBooking.isPending ? "Einen Moment…" : "Buchung anlegen"}
        </button>
      </form>
    </Dialog>
  );
}
