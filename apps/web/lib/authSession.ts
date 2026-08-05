export function redirectFor(role: "SUCHENDE" | "BETREIBER" | "ADMIN"): string {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "BETREIBER") return "/betreiber/dashboard";
  return "/";
}

export async function establishSession(tokens: {
  accessToken: string;
  refreshToken: string;
}) {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tokens),
  });
  if (!res.ok) {
    throw new Error("Sitzung konnte nicht gestartet werden.");
  }
}
