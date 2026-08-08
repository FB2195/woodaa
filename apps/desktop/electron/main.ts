import { readFile, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { app, BrowserWindow, ipcMain, safeStorage } from "electron";

function tokensFilePath(): string {
  return join(app.getPath("userData"), "auth-tokens.enc");
}

// Tokens are encrypted at rest via the OS keychain (Keychain on macOS, DPAPI
// on Windows - see Electron's safeStorage docs) rather than kept in a plain
// JSON file, since this file lives on disk indefinitely between app
// launches. Mirrors the intent of apps/mobile's expo-secure-store.
async function readTokens(): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const encrypted = await readFile(tokensFilePath());
    if (!safeStorage.isEncryptionAvailable()) return null;
    const decrypted = safeStorage.decryptString(encrypted);
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

async function writeTokens(tokens: { accessToken: string; refreshToken: string }): Promise<void> {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("OS-level secure storage is not available on this machine.");
  }
  const encrypted = safeStorage.encryptString(JSON.stringify(tokens));
  await writeFile(tokensFilePath(), encrypted);
}

async function clearTokens(): Promise<void> {
  await rm(tokensFilePath(), { force: true });
}

function registerAuthIpc() {
  ipcMain.handle("auth:getTokens", () => readTokens());
  ipcMain.handle("auth:setTokens", (_event, tokens) => writeTokens(tokens));
  ipcMain.handle("auth:clearTokens", () => clearTokens());
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: "#FAF9F5",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload: join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // electron-vite's own dev/prod convention: the dev server URL is injected
  // as an env var during `electron-vite dev`; a production build instead
  // loads the bundled renderer/index.html sitting next to main's output dir.
  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  registerAuthIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
