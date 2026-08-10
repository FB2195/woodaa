`splash-icon.png` (Kopie von apps/web/public/logo.png, unbeschnitten)
wird von components/AppSplashOverlay.tsx fuer den JS-gerenderten
Splash-Ersatz verwendet - dort wird die Groesse explizit per style
gesetzt, daher unpadded.

`splash-native.png` ist dieselbe Grafik, aber auf einer 2000x2000
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

App-Icon (`icon`) und Android-Adaptive-Icon-Vordergrund
(`android.adaptiveIcon.foregroundImage`) sind noch offen - das Logo ist
ein breites Wordmark, kein quadratisches Icon-Motiv, dafür wird eine
eigene Icon-Variante gebraucht.
