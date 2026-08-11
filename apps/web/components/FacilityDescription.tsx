"use client";

import { useState } from "react";

const PREVIEW_LENGTH = 280;

export function FacilityDescription({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!description) return null;

  const needsTruncation = description.length > PREVIEW_LENGTH;
  const preview = needsTruncation
    ? `${description.slice(0, PREVIEW_LENGTH).trimEnd()}…`
    : description;

  return (
    <div className="mt-10">
      <h2 className="text-lg font-semibold text-brand-text">Beschreibung</h2>
      <p className="mt-3 whitespace-pre-line text-brand-text">
        {expanded ? description : preview}
      </p>
      {needsTruncation && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-sm font-semibold text-brand-accent underline"
        >
          {expanded ? "Weniger anzeigen" : "Weiterlesen"}
        </button>
      )}
    </div>
  );
}
