`splash-icon.png` (Kopie von apps/web/public/logo.png) wird ueber den
legacy `splash`-Key in app.json (image/resizeMode/backgroundColor) als
Splash-Screen-Logo verwendet - das genuegt fuer SDK 51, ohne das
expo-splash-screen-npm-Paket/-Plugin zu brauchen (dessen
Options-Array wird von der in SDK 51 gebuendelten Version ohnehin
ignoriert, die liest nur den `splash`-Key).

App-Icon (`icon`) und Android-Adaptive-Icon-Vordergrund
(`android.adaptiveIcon.foregroundImage`) sind noch offen - das Logo ist
ein breites Wordmark, kein quadratisches Icon-Motiv, dafür wird eine
eigene Icon-Variante gebraucht.
