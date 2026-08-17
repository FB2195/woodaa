import type { Messages } from "../types";

// Source of truth - every other locale file must satisfy this exact shape
// (see Messages type in ../types.ts), so a missing translation is a
// compile-time error rather than a silently-blank string in production.
export const de: Messages = {
  header: {
    home: "Startseite",
    searchFacilities: "Pflegeheim suchen",
    registerFacility: "Pflegeheim registrieren",
    dashboard: "Dashboard",
    favorites: "Favoriten",
    myAccount: "Mein Konto",
    logout: "Abmelden",
    login: "Login",
    register: "Registrieren",
    helpSupport: "Hilfe & Support",
    customerService: "Kundenservice",
    aboutUs: "Über uns",
    privacy: "Datenschutz",
    imprint: "Impressum",
    cookieInfo: "Cookie-Infos",
    reportIssue: "Fehler/Problem melden",
    calculateCareBenefits: "Pflegeleistungen berechnen",
    operatorLogin: "Login für Pflegeeinrichtungen",
    myProfile: "Mein Profil",
    openMenu: "Menü öffnen",
    closeMenu: "Menü schließen",
    language: "Sprache",
  },
  footer: {
    brandColumn: "woodaa",
    helpColumn: "Hilfe & Support",
    legalColumn: "Rechtliches",
    faq: "FAQ",
    copyright: "© {year} woodaa",
  },
  home: {
    badge: "Deutschlandweit · geprüfte Einrichtungen · Verfügbarkeit in Echtzeit",
    heroTitleLine1: "Pflegeplatz online buchen",
    heroTitleLine2: "Jetzt bei woodaa",
    heroSubtitleLine1: "So einfach wie eine Hotelbuchung.",
    heroSubtitleLine2:
      "Mit woodaa finden Sie die passende Einrichtung und können sofort online buchen.",
    statsFacilitiesLabel: "Einrichtungen",
    statsCitiesLabel: "Städte",
    statsBookingTypesLabel: "Pflegearten",
    statsInstantBooking: "sofort verbindlich buchbar",
    whyTitle: "Warum woodaa?",
    trust1Title: "Echtzeit-Verfügbarkeit",
    trust1Text:
      "Kein Rätselraten am Telefon - Sie sehen sofort, wo aktuell wirklich ein Platz frei ist.",
    trust2Title: "Keine Doppelbuchung",
    trust2Text:
      "Jeder gebuchte Platz wird technisch abgesichert reserviert - garantiert kein Verwechseln, keine Doppelvergabe.",
    trust3Title: "Geprüfte Einrichtungen",
    trust3Text:
      "Jede Einrichtung wird vor der Veröffentlichung von uns geprüft, bevor sie sichtbar wird.",
    trust4Title: "Kostenlos & unverbindlich anfragen",
    trust4Text:
      "Erst in Ruhe informieren, dann entscheiden - eine Anfrage kostet nichts und verpflichtet zu nichts.",
    howItWorksTitle: "So funktioniert woodaa",
    step1Label: "Schritt 1",
    step1Title: "Suchen",
    step1Text:
      "Ort, Pflegeart und Budget eingeben - woodaa zeigt sofort, wo aktuell wirklich ein Platz frei ist.",
    step2Label: "Schritt 2",
    step2Title: "Buchen oder anfragen",
    step2Text:
      "Direkt verbindlich buchen oder erst unverbindlich Kontakt aufnehmen - du entscheidest das Tempo.",
    step3Label: "Schritt 3",
    step3Title: "Ankommen",
    step3Text:
      "Die Einrichtung ist informiert und bereitet den Einzug vor. Kein Hin- und Herfaxen, keine Doppelbuchung.",
    operatorCta: "Du betreibst eine Pflegeeinrichtung?",
    operatorCtaText: "Zeig deine echte Verfügbarkeit auf woodaa - ohne Mehraufwand für dein Team.",
    operatorCtaButton: "Einrichtung registrieren",
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
    label: "Design",
    light: "Hell",
    dark: "Dunkel",
  },
  account: {
    greeting: "Hallo {name}",
    manageAccount: "Konto verwalten",
    personalData: "Persönliche Angaben",
    securitySettings: "Sicherheitseinstellungen",
    exportData: "Meine Daten exportieren",
    notifications: "Benachrichtigungen",
    deleteAccount: "Konto löschen",
    bookingsAndCare: "Meine Buchungen & Pflege",
    myBookings: "Meine Buchungen",
    messages: "Nachrichten",
    requestCareBenefits: "Pflegeleistungen beantragen",
    authorizedRepresentative: "Bevollmächtigte/r Angehörige/r",
    savedSearches: "Gespeicherte Suchen",
    help: "Hilfe",
    helpFaq: "Hilfe & FAQ",
    more: "Mehr",
    language: "Sprache",
    downloadApp: "App herunterladen",
    registerFacility: "Unterkunft anmelden",
    legalAndPrivacy: "Rechtliches und Datenschutz",
    termsOfService: "Nutzungsbedingungen",
    logout: "Abmelden",
    loggingOut: "Abmelden…",
  },
  hilfe: {
    introText: "Hier findest du Antworten auf häufige Fragen und alle Wege, uns zu erreichen.",
    customerServiceCardText:
      "FAQ, Telefon-Hotline (24/7), KI-Chat, Rückruf anfordern oder eine individuelle Nachricht schreiben.",
    reportIssueCardText: "Etwas funktioniert nicht wie erwartet? Sag uns kurz, was los ist.",
    kundenserviceIntro:
      "Häufige Fragen, Telefon, Chat oder eine persönliche Nachricht - so erreichst du uns.",
    faqSectionTitle: "Häufige Fragen",
    phoneSectionTitle: "Telefon (24/7)",
    phonePlaceholder: "[Telefonnummer] - rund um die Uhr erreichbar",
    phoneCallbackHint: "Lieber zurückgerufen werden? Nutze das Rückruf-Formular weiter unten.",
    aiChatSectionTitle: "KI-Chat",
    aiChatSectionText: "Für schnelle Fragen rund um woodaa - jederzeit verfügbar.",
    callbackSectionTitle: "Rückruf anfordern",
    callbackSectionText: "Wir rufen dich unter der angegebenen Nummer zurück.",
    callbackSubmitLabel: "Rückruf anfordern",
    messageSectionTitle: "Nachricht schreiben",
    messageSectionText: "Für alles, was etwas ausführlicher ist.",
    messageSubmitLabel: "Nachricht senden",
    faqUserGroupTitle: "Für Nutzer",
    faqFacilityGroupTitle: "Für Einrichtungen",
  },
  datenschutz: {
    title: "Datenschutzerklärung",
    intro:
      "Diese Seite fasst zusammen, welche Daten woodaa verarbeitet und wofür. Sie ersetzt keine rechtliche Prüfung - bitte vor Live-Schaltung von einer/einem Datenschutzbeauftragten gegenprüfen lassen.",
    controllerTitle: "Verantwortlicher",
    controllerBody: "[Firmenname], [Adresse] - siehe",
    dataTitle: "Welche Daten wir verarbeiten",
    dataAccount: "Kontodaten: Name, E-Mail-Adresse, Passwort (verschlüsselt gespeichert)",
    dataCare:
      "Pflegebezogene Daten (nur wenn du sie angibst): Pflegegrad, Krankenkasse, Versicherungsnummer (verschlüsselt gespeichert, AES-256), Angaben zur gepflegten Person",
    dataBooking: "Buchungsdaten: gewünschte Einrichtung, Zeitraum, Zahlungsart, Zahlungsstatus",
    dataPayment:
      "Zahlungsdaten: werden direkt von unserem Zahlungsdienstleister Stripe verarbeitet, wir sehen keine vollständigen Kartendaten",
    dataReviews: "Bewertungen: Name (öffentlich sichtbar), Bewertungstext",
    dataLocation:
      "Standortangaben bei der Suche (Stadt/PLZ), verarbeitet über Google Maps/Places zur Umkreis- und Kartenanzeige",
    dataCookies: "Technisch notwendige Cookies, um dich eingeloggt zu halten (siehe Cookie-Infos)",
    purposeTitle: "Wofür wir sie nutzen",
    purposeBody:
      "Ausschließlich zur Bereitstellung des Dienstes: Kontoverwaltung, Suche und Buchung von Pflegeplätzen, Kommunikation mit Einrichtungen, Zahlungsabwicklung, Berechnung des voraussichtlichen Pflegekassen-Zuschusses. Kein Verkauf von Daten an Dritte, keine Werbe- oder Tracking-Cookies.",
    providersTitle: "Eingesetzte Dienstleister",
    providerStripe: "Stripe (Zahlungsabwicklung)",
    providerResend: "Resend (Versand von E-Mails, z. B. Buchungsbestätigungen)",
    providerR2: "Cloudflare R2 (Speicherung hochgeladener Dokumente, z. B. Vollmachten)",
    providerMaps: "Google Maps/Places (Kartenanzeige und Adressvorschläge)",
    providerHosting:
      "Hosting- und Datenbank-Infrastruktur in der EU/den USA (Auftragsverarbeitung vertraglich geregelt)",
    rightsTitle: "Deine Rechte",
    rightsBodyPre:
      "Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch gegen die Verarbeitung deiner Daten. Wende dich dazu über das",
    rightsBodyLinkText: "Kontaktformular",
    rightsBodyPost:
      "an uns. Du kannst dich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren.",
    retentionTitle: "Speicherdauer",
    retentionBody:
      "Wir speichern Daten nur so lange, wie es für die genannten Zwecke oder aufgrund gesetzlicher Aufbewahrungspflichten erforderlich ist. Konten und zugehörige Daten kannst du jederzeit über den Kundenservice löschen lassen.",
  },
  nutzungsbedingungen: {
    title: "Nutzungsbedingungen",
    intro:
      "Diese Seite fasst zusammen, wie woodaa genutzt werden darf. Sie ersetzt keine rechtliche Prüfung - bitte vor Live-Schaltung anwaltlich gegenprüfen lassen.",
    descriptionTitle: "Leistungsbeschreibung",
    descriptionBody:
      "woodaa vermittelt zwischen Pflegeeinrichtungen und Personen, die einen Pflegeplatz suchen - inklusive Echtzeit-Verfügbarkeit, verbindlicher Online-Buchung und Zahlungsabwicklung. woodaa ist nicht selbst Betreiber der gelisteten Einrichtungen.",
    registrationTitle: "Registrierung",
    registrationBody:
      "Für eine Buchung oder das Anlegen einer Einrichtung ist ein Konto mit wahrheitsgemäßen Angaben erforderlich. Du bist für die Richtigkeit deiner Angaben und die Sicherheit deines Passworts selbst verantwortlich.",
    bookingsTitle: "Buchungen",
    bookingsBody:
      "Eine Online-Buchung über woodaa ist sofort verbindlich. Stornobedingungen und Zahlungsabwicklung sind in der Buchungsstrecke sowie in den Angaben der jeweiligen Einrichtung beschrieben.",
    facilityDutiesTitle: "Pflichten der Einrichtungen",
    facilityDutiesBody:
      "Einrichtungen sind verpflichtet, Verfügbarkeit, Preise und Kontaktdaten wahrheitsgemäß und aktuell zu pflegen. Änderungen an Name, Adresse und Ansprechpartner werden vor der Veröffentlichung geprüft.",
    liabilityTitle: "Haftung",
    liabilityBody:
      "woodaa haftet nicht für die Richtigkeit der von Einrichtungen bereitgestellten Angaben oder für die tatsächliche Pflegequalität vor Ort. Für Vorsatz und grobe Fahrlässigkeit gilt diese Beschränkung nicht.",
    changesTitle: "Änderungen dieser Bedingungen",
    changesBody:
      "Wir können diese Nutzungsbedingungen bei Bedarf anpassen. Über wesentliche Änderungen informieren wir registrierte Nutzer:innen rechtzeitig.",
  },
};
