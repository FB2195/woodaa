import { useState } from "react";
import { Dialog } from "../Dialog";
import { Field, TextField } from "../Field";
import { trpc } from "../../lib/trpc";

export function AddEmployeeDialog({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils();
  const addEmployee = trpc.operator.addEmployee.useMutation({
    onSuccess: () => {
      utils.operator.employees.invalidate();
      onClose();
    },
  });

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog title="Mitarbeiter:in hinzufügen" onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          try {
            await addEmployee.mutateAsync({
              name: name.trim(),
              role: role.trim(),
              phone: phone.trim() || undefined,
              email: email.trim() || undefined,
            });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
          }
        }}
      >
        <Field label="Name">
          <TextField required value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Rolle">
          <TextField
            required
            placeholder="z. B. Pflegefachkraft"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          />
        </Field>
        <Field label="Telefon (optional)">
          <TextField type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
        </Field>
        <Field label="E-Mail (optional)">
          <TextField
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={addEmployee.isPending}
          className="rounded-xl2 bg-accentScale-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-250 ease-out-quart hover:bg-accentScale-600 disabled:opacity-50"
        >
          {addEmployee.isPending ? "Einen Moment…" : "Hinzufügen"}
        </button>
      </form>
    </Dialog>
  );
}
