export function StarRating({
  rating,
  size = "md",
}: {
  rating: number; // 0-5, may be fractional (e.g. an average)
  size?: "sm" | "md";
}) {
  const clamped = Math.max(0, Math.min(5, rating));
  const textSize = size === "sm" ? "text-sm" : "text-lg";

  return (
    <div
      className={`relative inline-flex ${textSize} leading-none text-brand-border`}
      role="img"
      aria-label={`${clamped.toLocaleString("de-DE", { maximumFractionDigits: 1 })} von 5 Sternen`}
    >
      <span aria-hidden="true">★★★★★</span>
      <span
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden text-brand-accent"
        style={{ width: `${(clamped / 5) * 100}%` }}
      >
        ★★★★★
      </span>
    </div>
  );
}
