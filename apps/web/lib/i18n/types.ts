export type Messages = {
  header: {
    registerFacility: string;
    dashboard: string;
    favorites: string;
    myAccount: string;
    logout: string;
    login: string;
    helpSupport: string;
    customerService: string;
    aboutUs: string;
    privacy: string;
    imprint: string;
    cookieInfo: string;
    reportIssue: string;
    myProfile: string;
    openMenu: string;
    closeMenu: string;
    language: string;
  };
  footer: {
    brandColumn: string;
    helpColumn: string;
    legalColumn: string;
    faq: string;
    copyright: string;
  };
  home: {
    badge: string;
    heroTitle: string;
    heroSubtitle: string;
    statsFacilitiesLabel: string;
    statsCitiesLabel: string;
    statsBookingTypesLabel: string;
    statsInstantBooking: string;
    whyTitle: string;
    trust1Title: string;
    trust1Text: string;
    trust2Title: string;
    trust2Text: string;
    trust3Title: string;
    trust3Text: string;
    trust4Title: string;
    trust4Text: string;
    howItWorksTitle: string;
    step1Label: string;
    step1Title: string;
    step1Text: string;
    step2Label: string;
    step2Title: string;
    step2Text: string;
    step3Label: string;
    step3Title: string;
    step3Text: string;
    operatorCta: string;
    operatorCtaText: string;
    operatorCtaButton: string;
  };
  language: {
    de: string;
    en: string;
    tr: string;
    it: string;
    fr: string;
    es: string;
  };
};

export const SUPPORTED_LOCALES = ["de", "en", "tr", "it", "fr", "es"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "de";

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
