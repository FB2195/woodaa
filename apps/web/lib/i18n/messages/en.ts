import type { Messages } from "../types";

export const en: Messages = {
  header: {
    home: "Home",
    searchFacilities: "Search care facilities",
    registerFacility: "Register your care facility",
    dashboard: "Dashboard",
    favorites: "Favorites",
    myAccount: "My account",
    logout: "Log out",
    login: "Log in",
    register: "Register",
    helpSupport: "Help & Support",
    customerService: "Customer service",
    aboutUs: "About us",
    privacy: "Privacy",
    imprint: "Legal notice",
    cookieInfo: "Cookie info",
    reportIssue: "Report a problem",
    operatorLogin: "Login for care facilities",
    myProfile: "My profile",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    language: "Language",
  },
  footer: {
    brandColumn: "woodaa",
    helpColumn: "Help & Support",
    legalColumn: "Legal",
    faq: "FAQ",
    copyright: "© {year} woodaa",
  },
  home: {
    badge: "Nationwide · vetted facilities · real-time availability",
    heroTitleLine1: "Book a care place online",
    heroTitleLine2: "Now with woodaa",
    heroSubtitleLine1: "As easy as booking a hotel.",
    heroSubtitleLine2:
      "With woodaa, you'll find the right facility and can book online right away.",
    statsFacilitiesLabel: "facilities",
    statsCitiesLabel: "cities",
    statsBookingTypesLabel: "care types",
    statsInstantBooking: "instantly bookable",
    whyTitle: "Why woodaa?",
    trust1Title: "Real-time availability",
    trust1Text:
      "No more guessing over the phone - you see immediately where a place is actually free right now.",
    trust2Title: "No double bookings",
    trust2Text:
      "Every booked place is reserved with a technical safeguard - no mix-ups, no double allocation, guaranteed.",
    trust3Title: "Vetted facilities",
    trust3Text: "Every facility is reviewed by us before it goes live.",
    trust4Title: "Free, no-obligation inquiries",
    trust4Text:
      "Take your time to find out more, then decide - an inquiry costs nothing and commits you to nothing.",
    howItWorksTitle: "How woodaa works",
    step1Label: "Step 1",
    step1Title: "Search",
    step1Text:
      "Enter location, care type and budget - woodaa instantly shows where a place is actually available right now.",
    step2Label: "Step 2",
    step2Title: "Book or inquire",
    step2Text:
      "Book directly and bindingly, or reach out first with no obligation - you set the pace.",
    step3Label: "Step 3",
    step3Title: "Arrive",
    step3Text:
      "The facility is notified and prepares for move-in. No back-and-forth faxing, no double bookings.",
    operatorCta: "Do you run a care facility?",
    operatorCtaText: "Show your real availability on woodaa - with no extra work for your team.",
    operatorCtaButton: "Register your facility",
  },
  language: {
    de: "Deutsch",
    en: "English",
    tr: "Türkçe",
    it: "Italiano",
    fr: "Français",
    es: "Español",
  },
  theme: {
    label: "Theme",
    light: "Light",
    dark: "Dark",
  },
  account: {
    greeting: "Hello {name}",
    manageAccount: "Manage account",
    personalData: "Personal details",
    securitySettings: "Security settings",
    exportData: "Export my data",
    deleteAccount: "Delete account",
    bookingsAndCare: "My bookings & care",
    myBookings: "My bookings",
    requestCareBenefits: "Apply for care benefits",
    authorizedRepresentative: "Authorized representative",
    savedSearches: "Saved searches",
    help: "Help",
    helpFaq: "Help & FAQ",
    more: "More",
    language: "Language",
    downloadApp: "Download the app",
    registerFacility: "Register your facility",
    legalAndPrivacy: "Legal & privacy",
    termsOfService: "Terms of service",
    logout: "Log out",
    loggingOut: "Logging out…",
  },
  hilfe: {
    introText: "Here you'll find answers to common questions and every way to reach us.",
    customerServiceCardText:
      "FAQ, phone hotline (24/7), AI chat, request a callback, or send us a personal message.",
    reportIssueCardText: "Something not working as expected? Let us know briefly what happened.",
    kundenserviceIntro:
      "Common questions, phone, chat, or a personal message - here's how to reach us.",
    faqSectionTitle: "Frequently asked questions",
    phoneSectionTitle: "Phone (24/7)",
    phonePlaceholder: "[Phone number] - available around the clock",
    phoneCallbackHint: "Prefer a callback? Use the callback form below.",
    aiChatSectionTitle: "AI chat",
    aiChatSectionText: "For quick questions about woodaa - available anytime.",
    callbackSectionTitle: "Request a callback",
    callbackSectionText: "We'll call you back at the number you provide.",
    callbackSubmitLabel: "Request callback",
    messageSectionTitle: "Send a message",
    messageSectionText: "For anything that needs a bit more detail.",
    messageSubmitLabel: "Send message",
    faqUserGroupTitle: "For users",
    faqFacilityGroupTitle: "For facilities",
  },
  datenschutz: {
    title: "Privacy policy",
    intro:
      "This page summarizes what data woodaa processes and why. It does not replace a legal review - please have it checked by a data protection officer before going live.",
    controllerTitle: "Data controller",
    controllerBody: "[Company name], [Address] - see",
    dataTitle: "What data we process",
    dataAccount: "Account data: name, email address, password (stored encrypted)",
    dataCare:
      "Care-related data (only if you provide it): care level, health insurance fund, insurance number (stored encrypted, AES-256), details about the person being cared for",
    dataBooking: "Booking data: requested facility, time period, payment method, payment status",
    dataPayment:
      "Payment data: processed directly by our payment provider Stripe - we never see full card details",
    dataReviews: "Reviews: name (publicly visible), review text",
    dataLocation:
      "Location details entered during search (city/postal code), processed via Google Maps/Places for radius and map display",
    dataCookies: "Technically necessary cookies to keep you logged in (see cookie info)",
    purposeTitle: "What we use it for",
    purposeBody:
      "Solely to provide the service: account management, searching and booking care places, communication with facilities, payment processing, estimating your expected care insurance subsidy. No selling of data to third parties, no advertising or tracking cookies.",
    providersTitle: "Service providers we use",
    providerStripe: "Stripe (payment processing)",
    providerResend: "Resend (sending emails, e.g. booking confirmations)",
    providerR2: "Cloudflare R2 (storing uploaded documents, e.g. powers of attorney)",
    providerMaps: "Google Maps/Places (map display and address suggestions)",
    providerHosting:
      "Hosting and database infrastructure in the EU/US (data processing agreements in place)",
    rightsTitle: "Your rights",
    rightsBodyPre:
      "You have the right to access, rectification, erasure, restriction of processing, data portability, and to object to the processing of your data. Get in touch via our",
    rightsBodyLinkText: "contact form",
    rightsBodyPost:
      "to let us know. You can also file a complaint with a data protection supervisory authority.",
    retentionTitle: "Retention period",
    retentionBody:
      "We only store data for as long as necessary for the purposes stated above or as required by law. You can have your account and related data deleted at any time via customer service.",
  },
  nutzungsbedingungen: {
    title: "Terms of service",
    intro:
      "This page summarizes how woodaa may be used. It does not replace a legal review - please have it checked by a lawyer before going live.",
    descriptionTitle: "Service description",
    descriptionBody:
      "woodaa connects care facilities with people looking for a care place - including real-time availability, binding online booking, and payment processing. woodaa does not itself operate the listed facilities.",
    registrationTitle: "Registration",
    registrationBody:
      "An account with truthful details is required to make a booking or list a facility. You are responsible for the accuracy of your details and the security of your password.",
    bookingsTitle: "Bookings",
    bookingsBody:
      "An online booking via woodaa is binding immediately. Cancellation terms and payment processing are described in the booking flow as well as in the respective facility's details.",
    facilityDutiesTitle: "Facility obligations",
    facilityDutiesBody:
      "Facilities are required to keep availability, prices, and contact details truthful and up to date. Changes to name, address, and contact person are reviewed before publication.",
    liabilityTitle: "Liability",
    liabilityBody:
      "woodaa is not liable for the accuracy of information provided by facilities or for the actual quality of care on site. This limitation does not apply to intent or gross negligence.",
    changesTitle: "Changes to these terms",
    changesBody:
      "We may amend these terms of service as needed. We'll inform registered users of material changes in good time.",
  },
};
