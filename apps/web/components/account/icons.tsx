// Small, self-contained stroke icons for the account menu - deliberately
// minimal (no icon library dependency), matching Header.tsx's PersonIcon
// pattern.

import type { ReactNode } from "react";

function base(children: ReactNode) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      {children}
    </svg>
  );
}

export function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function PersonIcon() {
  return base(
    <>
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </>,
  );
}

export function LockIcon() {
  return base(
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path strokeLinecap="round" d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>,
  );
}

export function TrashIcon() {
  return base(
    <>
      <path strokeLinecap="round" d="M4 7h16" />
      <path strokeLinecap="round" d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path strokeLinecap="round" d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    </>,
  );
}

export function CalendarIcon() {
  return base(
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path strokeLinecap="round" d="M8 3v4M16 3v4M4 10h16" />
    </>,
  );
}

export function HeartPulseIcon() {
  return base(
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 20s-7-4.35-9.5-8.5C.7 8 2.5 4.5 6 4.5c2 0 3.5 1.2 4 2.2.5-1 2-2.2 4-2.2 3.5 0 5.3 3.5 3.5 7C19 15.65 12 20 12 20z"
    />,
  );
}

export function UsersIcon() {
  return base(
    <>
      <circle cx="9" cy="8" r="3" />
      <path strokeLinecap="round" d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="9" r="2.5" />
      <path strokeLinecap="round" d="M15.5 14c2.5.3 4.5 2.4 4.5 5" />
    </>,
  );
}

export function DownloadIcon() {
  return base(
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v11m0 0l-4-4m4 4l4-4" />
      <path strokeLinecap="round" d="M4 19h16" />
    </>,
  );
}

export function BellIcon() {
  return base(
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />,
  );
}

export function HelpCircleIcon() {
  return base(
    <>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7v.5" />
      <path strokeLinecap="round" d="M12 17h.01" />
    </>,
  );
}

export function ShieldIcon() {
  return base(
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z"
    />,
  );
}

export function HomeIcon() {
  return base(
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 11l8-7 8 7" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9"
      />
    </>,
  );
}

export function SmartphoneIcon() {
  return base(
    <>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path strokeLinecap="round" d="M11 18h2" />
    </>,
  );
}

export function GlobeIcon() {
  return base(
    <>
      <circle cx="12" cy="12" r="9" />
      <path
        strokeLinecap="round"
        d="M3 12h18M12 3c2.5 2.5 3.8 5.8 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.8-3.8-9s1.3-6.5 3.8-9z"
      />
    </>,
  );
}

export function LogOutIcon() {
  return base(
    <>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 16l4-4-4-4" />
      <path strokeLinecap="round" d="M20 12H9" />
    </>,
  );
}
