`wordmark-dark-bg.png` und `wordmark-light-bg.png` sind der aktuelle
Wordmark (Lupe mit medizinischem Kreuz + "Wo? Da!"-Tagline, vom Nutzer
als offizielles Logo geliefert), unbeschnitten (tight bounding box),
in zwei Farbvarianten: Das Original ist eine flache Salbeigruen-Schrift
mit sehr hellgrauer Tagline - das liest sich gut auf einem dunklen
Hintergrund (`wordmark-dark-bg.png`, unveraendert, genutzt im
Tab-Header vor dessen dunkelgruenem headerStyle-Hintergrund), aber auf
dem hellen/cremefarbenen App-Hintergrund (#FAF9F5) waere der Kontrast
zu schwach (WCAG-Kontrast Haupttext ~2.6:1, Tagline ~1.2:1 - praktisch
unsichtbar). `wordmark-light-bg.png` ist exakt dieselbe Grafik, nur mit
Haupttext/Tagline auf die Marken-Farbtoene primary (#5B6B3F, ~5.5:1
Kontrast) bzw. textMuted (#6B6F62, ~4.9:1 Kontrast) aus
packages/ui/src/tokens.ts umgefaerbt (per Farbabstand-Ersetzung, nur
die beiden flachen Text-Farbtoene betroffen, die Lupen-/Kreuz-Grafik
mit ihrem eigenen Gradient/Schatten blieb unangetastet) - wird ueberall
auf hellem Hintergrund verwendet (aktuell components/AppSplashOverlay.tsx).
Falls das Logo kuenftig auf weiteren Hintergruenden auftaucht, die
passende Variante waehlen statt eine dritte Farbvariante zu erfinden.

`splash-native.png` ist `wordmark-light-bg.png` auf einer 2000x2000
groesstenteils transparenten Flaeche zentriert (Logo ca. 35% der
Breite). Wird ueber den legacy `splash`-Key in app.json
(image/resizeMode/backgroundColor) als natives Splash-Bild verwendet -
das genuegt fuer SDK 51, ohne das expo-splash-screen-npm-Paket/-Plugin
zu brauchen (dessen Options-Array wird von der in SDK 51 gebuendelten
Version ohnehin ignoriert, die liest nur den `splash`-Key). Ohne das
Padding skaliert Androids natives contain-Fitting das unbeschnittene
Logo auf volle Bildschirmbreite - das Padding sorgt fuer eine
angemessene, mittige Groesse.

_layout.tsx haelt zusaetzlich ueber components/AppSplashOverlay.tsx +
einen simplen React-State-Timer (kein natives Modul, siehe Kommentar
dort) eine Mindestanzeigezeit ein, damit das Logo nicht nur kurz
aufblitzt.

`icon.png` und `adaptive-icon-foreground.png` sind das dedizierte
Homescreen-Icon-Design (separat vom Wordmark oben abgestimmt): der
volle "woodaa"-Schriftzug (ohne "Wo? Da!"-Tagline) in Weiss, fett
(via ImageFilter.MaxFilter-Dilation auf der Alpha-Maske vor dem
Hochskalieren, danach UnsharpMask fuer scharfe statt verwaschene
Kanten), auf dunklem Olivgruen (#3E4A2B, Marken-Token primaryDark).
Quellaufloesung der Wordmark-Grafik ist relativ klein (~466x130px
im Originalfoto) - fuer ein noch schaerferes Ergebnis bei Gelegenheit
eine hoeher aufgeloeste/vektorisierte Quelle besorgen.

`icon.png` ist deckend (kein Alphakanal, volles 1024x1024-Quadrat
ohne eingebackene Rundung - iOS/Android wenden ihre eigene
Icon-Maske an) und dient als iOS-Icon sowie als Android-Fallback.
`adaptive-icon-foreground.png` ist nur die weisse Wordmark auf
transparentem Grund, deutlich kleiner skaliert (62% statt 88% Breite)
als in icon.png - Androids Adaptive-Icon-Sicherheitsbereich schneidet
je nach Launcher-Form (Kreis, Squircle, ...) recht aggressiv, das
kleinere Sizing haelt den Schriftzug auch im engsten Fall (Kreismaske)
komplett sichtbar (siehe android.adaptiveIcon.backgroundColor
in app.json, auf denselben Olivgruenton gesetzt).
