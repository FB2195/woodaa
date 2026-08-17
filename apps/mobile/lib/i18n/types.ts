// Ported verbatim from apps/web/lib/i18n/types.ts (kept in sync manually) -
// same Messages shape and the same six already-translated message files,
// so translations don't drift between platforms. `footer` has no mobile
// equivalent (there's no footer component, the bottom tab bar serves that
// role) and stays unused here, kept only so the copied message files below
// satisfy this type without per-platform edits.
export type Messages = {
  header: {
    home: string;
    searchFacilities: string;
    registerFacility: string;
    dashboard: string;
    favorites: string;
    myAccount: string;
    logout: string;
    login: string;
    register: string;
    helpSupport: string;
    customerService: string;
    aboutUs: string;
    privacy: string;
    imprint: string;
    cookieInfo: string;
    reportIssue: string;
    calculateCareBenefits: string;
    operatorLogin: string;
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
    heroTitleLine1: string;
    heroTitleLine2: string;
    heroSubtitleLine1: string;
    heroSubtitleLine2: string;
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
  theme: {
    label: string;
    light: string;
    dark: string;
  };
  account: {
    greeting: string;
    manageAccount: string;
    personalData: string;
    securitySettings: string;
    exportData: string;
    notifications: string;
    deleteAccount: string;
    bookingsAndCare: string;
    myBookings: string;
    messages: string;
    requestCareBenefits: string;
    authorizedRepresentative: string;
    savedSearches: string;
    help: string;
    helpFaq: string;
    more: string;
    language: string;
    downloadApp: string;
    registerFacility: string;
    legalAndPrivacy: string;
    termsOfService: string;
    logout: string;
    loggingOut: string;
  };
  hilfe: {
    introText: string;
    customerServiceCardText: string;
    reportIssueCardText: string;
    kundenserviceIntro: string;
    faqSectionTitle: string;
    phoneSectionTitle: string;
    phonePlaceholder: string;
    phoneCallbackHint: string;
    aiChatSectionTitle: string;
    aiChatSectionText: string;
    callbackSectionTitle: string;
    callbackSectionText: string;
    callbackSubmitLabel: string;
    messageSectionTitle: string;
    messageSectionText: string;
    messageSubmitLabel: string;
    faqUserGroupTitle: string;
    faqFacilityGroupTitle: string;
  };
  datenschutz: {
    title: string;
    intro: string;
    controllerTitle: string;
    controllerBody: string;
    dataTitle: string;
    dataAccount: string;
    dataCare: string;
    dataBooking: string;
    dataPayment: string;
    dataReviews: string;
    dataLocation: string;
    dataCookies: string;
    purposeTitle: string;
    purposeBody: string;
    providersTitle: string;
    providerStripe: string;
    providerResend: string;
    providerR2: string;
    providerMaps: string;
    providerHosting: string;
    rightsTitle: string;
    rightsBodyPre: string;
    rightsBodyLinkText: string;
    rightsBodyPost: string;
    retentionTitle: string;
    retentionBody: string;
  };
  nutzungsbedingungen: {
    title: string;
    intro: string;
    descriptionTitle: string;
    descriptionBody: string;
    registrationTitle: string;
    registrationBody: string;
    bookingsTitle: string;
    bookingsBody: string;
    facilityDutiesTitle: string;
    facilityDutiesBody: string;
    liabilityTitle: string;
    liabilityBody: string;
    changesTitle: string;
    changesBody: string;
  };
};

export const SUPPORTED_LOCALES = ["de", "en", "tr", "it", "fr", "es"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "de";

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
