"use client";

export function StarRatingInput({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: number; // 0 = nothing selected yet
  onChange: (value: number) => void;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 text-sm text-brand-text">
      <span>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </span>
      <div className="flex gap-1" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} ${star === 1 ? "Stern" : "Sterne"}`}
            onClick={() => onChange(star)}
            className={`text-2xl leading-none transition ${
              star <= value ? "text-brand-accent" : "text-brand-border"
            } hover:text-brand-accent`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}
