import type { Locale } from "./types";

export type FaqEntry = { question: string; answer: string };
export type FaqData = { userFaqs: FaqEntry[]; facilityFaqs: FaqEntry[] };

const de: FaqData = {
  userFaqs: [
    {
      question: "Wie finde ich einen passenden Pflegeplatz?",
      answer:
        "Gib in der Suche Stadt oder PLZ ein und wähle optional Pflegeart, Umkreis und Pflegegrad aus. Du siehst sofort, welche Einrichtungen freie Plätze haben.",
    },
    {
      question: "Wie funktioniert die Buchung?",
      answer:
        "Nach dem Login kannst du einen freien Platz direkt und verbindlich buchen - wie bei einem Hotel. Der Platz wird sofort für dich reserviert.",
    },
    {
      question: "Wie wird mein voraussichtlicher Eigenanteil berechnet?",
      answer:
        "Auf jeder Einrichtungsseite und beim Buchen zeigen wir dir eine Einschätzung auf Basis deines Pflegegrads und der von der Einrichtung hinterlegten Sätze. Die tatsächliche Höhe bestätigt am Ende deine Pflegekasse.",
    },
    {
      question: "Kann ich eine Buchung stornieren?",
      answer:
        "Ja, bis 48 Stunden vor dem geplanten Termin kostenlos - danach sprich bitte direkt mit der Einrichtung.",
    },
    {
      question: "Wie bezahle ich?",
      answer:
        "Per Kreditkarte, Klarna oder PayPal direkt über woodaa, oder per Rechnung/Kostenübernahme durch die Pflegekasse - je nachdem, was die Einrichtung anbietet.",
    },
    {
      question: "Ich habe noch keinen Pflegegrad - kann ich trotzdem buchen?",
      answer:
        "Ja. Gib beim Buchen an, dass noch kein Pflegegrad vorliegt oder ein Antrag läuft - wir helfen dir sogar, den Antrag digital bei deiner Pflegekasse einzureichen.",
    },
    {
      question: "Wie kann ich eine Einrichtung bewerten?",
      answer:
        'Nur wer eine Einrichtung bereits über woodaa gebucht hat, kann sie bewerten - auf der Einrichtungsseite findest du dazu den Button „Pflegeheim bewerten".',
    },
  ],
  facilityFaqs: [
    {
      question: "Wie registriere ich mein Pflegeheim bei woodaa?",
      answer:
        'Über „Pflegeheim registrieren" im Menü - die Einrichtung ist danach zunächst nur intern für dich sichtbar, bis unser Team sie für die öffentliche Suche freigibt.',
    },
    {
      question: "Kostet das Verfügbarkeits-Tool etwas?",
      answer:
        "Nein, es ist dauerhaft kostenlos nutzbar - unabhängig davon, ob ihr euch öffentlich auf woodaa listen lasst.",
    },
    {
      question: "Wie pflege ich unsere freien Plätze und Preise?",
      answer:
        "Alles läuft über euer Betreiber-Dashboard nach dem Login - dort verwaltet ihr Verfügbarkeiten, Pflegegrad-Preise und eure Einrichtungsdaten selbst.",
    },
    {
      question: "Wie werden Buchungen bestätigt?",
      answer:
        "Direktbuchungen über woodaa sind sofort verbindlich und reservieren den Platz automatisch - Doppelbuchungen sind technisch ausgeschlossen.",
    },
  ],
};

const en: FaqData = {
  userFaqs: [
    {
      question: "How do I find the right care placement?",
      answer:
        "Enter a city or postal code in the search bar and optionally pick a care type, radius and care level. You'll immediately see which facilities have places available.",
    },
    {
      question: "How does booking work?",
      answer:
        "Once logged in, you can book a free place directly and bindingly - just like a hotel. The place is reserved for you immediately.",
    },
    {
      question: "How is my expected out-of-pocket cost calculated?",
      answer:
        "On every facility page and during booking we show you an estimate based on your care level and the facility's rates. Your care insurance confirms the actual amount in the end.",
    },
    {
      question: "Can I cancel a booking?",
      answer:
        "Yes, free of charge up to 48 hours before the planned date - after that, please contact the facility directly.",
    },
    {
      question: "How do I pay?",
      answer:
        "By credit card, Klarna or PayPal directly via woodaa, or by invoice/cost coverage through your care insurance - depending on what the facility offers.",
    },
    {
      question: "I don't have a care level yet - can I still book?",
      answer:
        "Yes. Just indicate when booking that no care level exists yet or that an application is in progress - we'll even help you submit the application to your care insurance digitally.",
    },
    {
      question: "How can I review a facility?",
      answer:
        'Only people who have already booked a facility through woodaa can review it - you\'ll find the "Rate this facility" button on the facility page.',
    },
  ],
  facilityFaqs: [
    {
      question: "How do I register my facility with woodaa?",
      answer:
        'Via "Register facility" in the menu - your facility is initially only visible to you internally, until our team approves it for public search.',
    },
    {
      question: "Does the availability tool cost anything?",
      answer:
        "No, it's free to use permanently - regardless of whether you choose to be listed publicly on woodaa.",
    },
    {
      question: "How do I manage our free places and prices?",
      answer:
        "Everything runs through your operator dashboard after logging in - there you manage availability, care-level pricing and your facility details yourself.",
    },
    {
      question: "How are bookings confirmed?",
      answer:
        "Direct bookings via woodaa are binding immediately and reserve the place automatically - double bookings are technically impossible.",
    },
  ],
};

const tr: FaqData = {
  userFaqs: [
    {
      question: "Uygun bir bakım yeri nasıl bulurum?",
      answer:
        "Arama alanına şehir veya posta kodu girin, isteğe bağlı olarak bakım türü, yarıçap ve bakım derecesi seçin. Hangi kurumlarda boş yer olduğunu hemen görürsünüz.",
    },
    {
      question: "Rezervasyon nasıl işliyor?",
      answer:
        "Giriş yaptıktan sonra boş bir yeri otel rezervasyonu gibi doğrudan ve bağlayıcı şekilde ayırtabilirsiniz. Yer sizin için anında rezerve edilir.",
    },
    {
      question: "Tahmini kendi payım nasıl hesaplanıyor?",
      answer:
        "Her kurum sayfasında ve rezervasyon sırasında, bakım dereceniz ve kurumun belirlediği ücretlere dayalı bir tahmin gösteriyoruz. Kesin tutarı sonunda bakım sigortanız onaylar.",
    },
    {
      question: "Rezervasyonu iptal edebilir miyim?",
      answer:
        "Evet, planlanan tarihten 48 saat öncesine kadar ücretsiz - sonrasında lütfen doğrudan kurumla iletişime geçin.",
    },
    {
      question: "Ödemeyi nasıl yapıyorum?",
      answer:
        "Kredi kartı, Klarna veya PayPal ile doğrudan woodaa üzerinden, ya da fatura/bakım sigortası tarafından karşılanan tutar ile - kurumun sunduğu seçeneğe bağlı olarak.",
    },
    {
      question: "Henüz bakım derecem yok - yine de rezervasyon yapabilir miyim?",
      answer:
        "Evet. Rezervasyon sırasında henüz bakım derecesi olmadığını veya başvurunun devam ettiğini belirtin - başvuruyu bakım sigortanıza dijital olarak iletmenizde bile yardımcı oluruz.",
    },
    {
      question: "Bir kurumu nasıl değerlendirebilirim?",
      answer:
        'Yalnızca woodaa üzerinden bir kurumda rezervasyon yapmış kişiler değerlendirme yazabilir - kurum sayfasında "Pflegeheim bewerten" butonunu bulabilirsiniz.',
    },
  ],
  facilityFaqs: [
    {
      question: "Bakım evimi woodaa'ya nasıl kaydettiririm?",
      answer:
        'Menüdeki "Pflegeheim registrieren" üzerinden - kurumunuz önce yalnızca sizin için dahili olarak görünür, ekibimiz onaylayana kadar herkese açık aramada yer almaz.',
    },
    {
      question: "Müsaitlik aracının bir ücreti var mı?",
      answer:
        "Hayır, kalıcı olarak ücretsizdir - woodaa üzerinde herkese açık olarak listelenmeyi tercih etseniz de etmeseniz de.",
    },
    {
      question: "Boş yerlerimizi ve fiyatlarımızı nasıl güncelleriz?",
      answer:
        "Her şey giriş yaptıktan sonra işletmeci panelinizden yürütülür - burada müsaitlik, bakım derecesine göre fiyatlar ve kurum bilgilerinizi kendiniz yönetirsiniz.",
    },
    {
      question: "Rezervasyonlar nasıl onaylanır?",
      answer:
        "woodaa üzerinden yapılan doğrudan rezervasyonlar anında bağlayıcıdır ve yeri otomatik olarak ayırtır - çifte rezervasyon teknik olarak imkansızdır.",
    },
  ],
};

const it: FaqData = {
  userFaqs: [
    {
      question: "Come trovo un posto di assistenza adatto?",
      answer:
        "Inserisci città o CAP nella ricerca e seleziona facoltativamente tipo di assistenza, raggio e livello di non autosufficienza. Vedrai subito quali strutture hanno posti liberi.",
    },
    {
      question: "Come funziona la prenotazione?",
      answer:
        "Dopo l'accesso puoi prenotare un posto libero direttamente e in modo vincolante - come in hotel. Il posto viene riservato immediatamente per te.",
    },
    {
      question: "Come viene calcolata la mia quota a carico prevista?",
      answer:
        "Su ogni pagina struttura e durante la prenotazione mostriamo una stima basata sul tuo livello di non autosufficienza e sulle tariffe indicate dalla struttura. L'importo effettivo viene confermato alla fine dalla tua cassa assistenza.",
    },
    {
      question: "Posso annullare una prenotazione?",
      answer:
        "Sì, gratuitamente fino a 48 ore prima della data prevista - dopo, contatta direttamente la struttura.",
    },
    {
      question: "Come pago?",
      answer:
        "Con carta di credito, Klarna o PayPal direttamente su woodaa, oppure tramite fattura/copertura della cassa assistenza - a seconda di quanto offerto dalla struttura.",
    },
    {
      question: "Non ho ancora un livello di non autosufficienza - posso comunque prenotare?",
      answer:
        "Sì. Indica durante la prenotazione che non hai ancora un livello riconosciuto o che la domanda è in corso - ti aiutiamo anche a inoltrare la domanda digitalmente alla tua cassa assistenza.",
    },
    {
      question: "Come posso recensire una struttura?",
      answer:
        'Solo chi ha già prenotato una struttura tramite woodaa può recensirla - trovi il pulsante "Valuta struttura" nella pagina della struttura.',
    },
  ],
  facilityFaqs: [
    {
      question: "Come registro la mia struttura su woodaa?",
      answer:
        'Tramite "Registra struttura" nel menu - la struttura è inizialmente visibile solo a te internamente, finché il nostro team non la approva per la ricerca pubblica.',
    },
    {
      question: "Lo strumento di disponibilità ha un costo?",
      answer:
        "No, è utilizzabile gratuitamente in modo permanente - indipendentemente dal fatto che scegliate di essere elencati pubblicamente su woodaa.",
    },
    {
      question: "Come gestisco i nostri posti liberi e i prezzi?",
      answer:
        "Tutto avviene tramite la vostra dashboard gestore dopo l'accesso - lì gestite autonomamente disponibilità, prezzi per livello di non autosufficienza e i dati della struttura.",
    },
    {
      question: "Come vengono confermate le prenotazioni?",
      answer:
        "Le prenotazioni dirette tramite woodaa sono immediatamente vincolanti e riservano il posto automaticamente - le doppie prenotazioni sono tecnicamente escluse.",
    },
  ],
};

const fr: FaqData = {
  userFaqs: [
    {
      question: "Comment trouver une place d'accueil adaptée ?",
      answer:
        "Indiquez la ville ou le code postal dans la recherche et sélectionnez éventuellement le type de soins, le rayon et le degré de dépendance. Vous voyez immédiatement quels établissements ont des places libres.",
    },
    {
      question: "Comment fonctionne la réservation ?",
      answer:
        "Une fois connecté(e), vous pouvez réserver une place libre directement et de façon ferme - comme pour un hôtel. La place vous est réservée immédiatement.",
    },
    {
      question: "Comment est calculé mon reste à charge estimé ?",
      answer:
        "Sur chaque page d'établissement et lors de la réservation, nous affichons une estimation basée sur votre degré de dépendance et les tarifs indiqués par l'établissement. Le montant définitif est confirmé par votre caisse de soins.",
    },
    {
      question: "Puis-je annuler une réservation ?",
      answer:
        "Oui, gratuitement jusqu'à 48 heures avant la date prévue - après, veuillez contacter directement l'établissement.",
    },
    {
      question: "Comment puis-je payer ?",
      answer:
        "Par carte bancaire, Klarna ou PayPal directement via woodaa, ou par facture/prise en charge par la caisse de soins - selon ce que propose l'établissement.",
    },
    {
      question: "Je n'ai pas encore de degré de dépendance reconnu - puis-je quand même réserver ?",
      answer:
        "Oui. Indiquez lors de la réservation qu'aucun degré n'est encore attribué ou qu'une demande est en cours - nous vous aidons même à transmettre la demande numériquement à votre caisse de soins.",
    },
    {
      question: "Comment puis-je évaluer un établissement ?",
      answer:
        "Seules les personnes ayant déjà réservé un établissement via woodaa peuvent le noter - vous trouverez le bouton « Évaluer l'établissement » sur la page de l'établissement.",
    },
  ],
  facilityFaqs: [
    {
      question: "Comment inscrire mon établissement sur woodaa ?",
      answer:
        "Via « Inscrire un établissement » dans le menu - l'établissement n'est d'abord visible que pour vous en interne, jusqu'à validation par notre équipe pour la recherche publique.",
    },
    {
      question: "L'outil de disponibilité est-il payant ?",
      answer:
        "Non, il est utilisable gratuitement en permanence - que vous choisissiez ou non d'être répertorié publiquement sur woodaa.",
    },
    {
      question: "Comment gérer nos places libres et nos tarifs ?",
      answer:
        "Tout se passe via votre tableau de bord gestionnaire après connexion - vous y gérez vous-même les disponibilités, les tarifs par degré de dépendance et les données de votre établissement.",
    },
    {
      question: "Comment les réservations sont-elles confirmées ?",
      answer:
        "Les réservations directes via woodaa sont immédiatement fermes et réservent la place automatiquement - les doubles réservations sont techniquement exclues.",
    },
  ],
};

const es: FaqData = {
  userFaqs: [
    {
      question: "¿Cómo encuentro una plaza asistencial adecuada?",
      answer:
        "Introduce la ciudad o el código postal en la búsqueda y, opcionalmente, elige el tipo de cuidado, el radio y el grado de dependencia. Verás de inmediato qué centros tienen plazas libres.",
    },
    {
      question: "¿Cómo funciona la reserva?",
      answer:
        "Una vez conectado/a, puedes reservar una plaza libre de forma directa y vinculante, como en un hotel. La plaza se reserva para ti al instante.",
    },
    {
      question: "¿Cómo se calcula mi copago estimado?",
      answer:
        "En cada página de centro y durante la reserva mostramos una estimación basada en tu grado de dependencia y las tarifas indicadas por el centro. El importe definitivo lo confirma finalmente tu seguro de dependencia.",
    },
    {
      question: "¿Puedo cancelar una reserva?",
      answer:
        "Sí, de forma gratuita hasta 48 horas antes de la fecha prevista; después, ponte en contacto directamente con el centro.",
    },
    {
      question: "¿Cómo pago?",
      answer:
        "Con tarjeta de crédito, Klarna o PayPal directamente a través de woodaa, o mediante factura/cobertura del seguro de dependencia, según lo que ofrezca el centro.",
    },
    {
      question: "Todavía no tengo grado de dependencia reconocido, ¿puedo reservar igualmente?",
      answer:
        "Sí. Indica al reservar que aún no tienes grado reconocido o que la solicitud está en trámite; incluso te ayudamos a presentar la solicitud digitalmente ante tu seguro de dependencia.",
    },
    {
      question: "¿Cómo puedo valorar un centro?",
      answer:
        'Solo quienes ya han reservado un centro a través de woodaa pueden valorarlo; encontrarás el botón "Valorar centro" en la página del centro.',
    },
  ],
  facilityFaqs: [
    {
      question: "¿Cómo registro mi centro en woodaa?",
      answer:
        'A través de "Registrar centro" en el menú; el centro solo será visible internamente para ti hasta que nuestro equipo lo apruebe para la búsqueda pública.',
    },
    {
      question: "¿La herramienta de disponibilidad tiene algún coste?",
      answer:
        "No, su uso es gratuito de forma permanente, independientemente de que decidáis apareceros públicamente en woodaa.",
    },
    {
      question: "¿Cómo gestiono nuestras plazas libres y precios?",
      answer:
        "Todo se gestiona desde el panel de gestor tras iniciar sesión; allí administráis vosotros mismos la disponibilidad, los precios por grado de dependencia y los datos del centro.",
    },
    {
      question: "¿Cómo se confirman las reservas?",
      answer:
        "Las reservas directas a través de woodaa son vinculantes de inmediato y reservan la plaza automáticamente; las reservas duplicadas quedan técnicamente excluidas.",
    },
  ],
};

export const faqByLocale: Record<Locale, FaqData> = { de, en, tr, it, fr, es };
