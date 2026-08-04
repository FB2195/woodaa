import type { PhotoCategory } from "@woodaa/api";

// Designed placeholder tiles for facilities without a real photo upload
// (see the FacilityPhoto.key comment in schema.prisma) - a gradient + icon
// per category, with a small deterministic variation per `seed` so a page
// full of these doesn't look like the same tile repeated.
const CATEGORY_META: Record<
  PhotoCategory,
  { icon: string; label: string; gradients: [string, string][] }
> = {
  AUSSENANSICHT: {
    icon: "🏡",
    label: "Außenansicht",
    gradients: [
      ["#8BA888", "#3E4A2B"],
      ["#9CB68F", "#4A5A38"],
      ["#7C9473", "#354228"],
    ],
  },
  GARTEN: {
    icon: "🌳",
    label: "Garten",
    gradients: [
      ["#A3C77A", "#4A6B3A"],
      ["#8FBF6E", "#3E5A32"],
      ["#B0CC8C", "#527048"],
    ],
  },
  STATION: {
    icon: "🛋️",
    label: "Gemeinschaftsraum",
    gradients: [
      ["#C9B896", "#7A6A4A"],
      ["#D4C6A5", "#8A7A56"],
      ["#BCAB86", "#6E5F40"],
    ],
  },
  ZIMMER: {
    icon: "🛏️",
    label: "Zimmer",
    gradients: [
      ["#9CB4C9", "#4A6478"],
      ["#A8BFCF", "#526E82"],
      ["#8FA9BC", "#42596C"],
    ],
  },
  SONSTIGE: {
    icon: "📷",
    label: "Impression",
    gradients: [
      ["#B8A8C9", "#5A4A6E"],
      ["#C2B4D0", "#655574"],
    ],
  },
};

function hashIndex(seed: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash % length;
}

export function PlaceholderPhoto({
  category,
  seed,
  showLabel = false,
  className = "",
}: {
  category?: PhotoCategory | null;
  seed: string;
  showLabel?: boolean;
  className?: string;
}) {
  const meta = CATEGORY_META[category ?? "SONSTIGE"];
  const [from, to] = meta.gradients[hashIndex(seed, meta.gradients.length)]!;

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <span className="text-4xl" aria-hidden="true">
        {meta.icon}
      </span>
      {showLabel && (
        <span className="absolute bottom-2 left-2 rounded-brand-full bg-black/30 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
          {meta.label}
        </span>
      )}
    </div>
  );
}
