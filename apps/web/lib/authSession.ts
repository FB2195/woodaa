export function redirectFor(role: "SUCHENDE" | "BETREIBER" | "MITARBEITER" | "ADMIN"): string {
  if (role === "ADMIN") return "/admin/dashboard";
  // Both land on /betreiber/dashboard - the layout itself branches on role,
  // showing a MITARBEITER only their read-only Dienstplan (see
  // app/betreiber/dashboard/layout.tsx) instead of the full BETREIBER shell.
  if (role === "BETREIBER" || role === "MITARBEITER") return "/betreiber/dashboard";
  return "/";
}

export async function establishSession(tokens: { accessToken: string; refreshToken: string }) {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tokens),
  });
  if (!res.ok) {
    throw new Error("Sitzung konnte nicht gestartet werden.");
  }
}
