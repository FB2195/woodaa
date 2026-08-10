import { Image, StyleSheet, View } from "react-native";
import splashLogo from "../assets/wordmark-light-bg.png";

// Matches app.json's native splash (same background color) so there's no
// visible flash when this JS overlay takes over from it. Renders the
// tight-cropped logo (not assets/splash-native.png, which is padded for the
// native contain-fit splash) at a fixed, modest size we control directly.
// Uses the light-background-safe color variant (see assets/README.md) since
// this overlay's background is the light/cream brand background color.
export function AppSplashOverlay() {
  return (
    <View style={styles.container}>
      <Image source={splashLogo} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F5",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 320,
    height: 89,
  },
});
