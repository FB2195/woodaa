"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "woodaa_compare_ids";
const CHANGE_EVENT = "woodaa:compare-changed";
export const MAX_COMPARE = 3;

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  // storage only fires in OTHER tabs, not this one - every CompareToggle
  // and the floating CompareBar need to hear about same-tab changes too.
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// localStorage-backed "compare tray" selection, e-commerce-style: no
// backend involved (see facility.byIds, which only fetches the details for
// whatever IDs end up here), capped at MAX_COMPARE. One shared hook so
// every CompareToggle (per search-result/favorite card) and the single
// floating CompareBar stay in sync without prop-drilling through server
// components - facility.list/favorite.list stay server-rendered as before.
export function useCompareList() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(readIds());
    const onChange = () => setIds(readIds());
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    const current = readIds();
    const next = current.includes(id)
      ? current.filter((existing) => existing !== id)
      : current.length < MAX_COMPARE
        ? [...current, id]
        : current;
    writeIds(next);
  }, []);

  const remove = useCallback((id: string) => {
    writeIds(readIds().filter((existing) => existing !== id));
  }, []);

  const clear = useCallback(() => writeIds([]), []);

  return { ids, toggle, remove, clear, max: MAX_COMPARE };
}
