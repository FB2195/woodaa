// Curated list of common Pflegeheim-Zusatzleistungen, shown as checkboxes
// when operators set up their Ausstattung (see AmenitiesEditor.tsx).
// Facility.amenities itself stays a plain string array in the DB, so an
// operator can still add something not on this list via "Eigene Angabe".
export const AMENITY_OPTIONS = [
  "Einzelzimmer",
  "Doppelzimmer",
  "Blick ins Grüne",
  "Balkon/Terrasse im Zimmer",
  "TV im Zimmer",
  "Telefon im Zimmer",
  "WLAN im Zimmer",
  "Barrierefreiheit",
  "Garten",
  "Cafeteria",
  "Friseursalon",
  "Fußpflege",
  "Bibliothek",
  "Haustiere erlaubt",
  "Seelsorge/religiöse Angebote",
  "Ergotherapie",
  "Physiotherapie",
  "Demenzbetreuung",
  "Palliativpflege",
  "Eigene Küche/Vollverpflegung",
  "Wäscheservice",
  "Notrufsystem",
] as const;
