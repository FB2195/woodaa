import { contextBridge, ipcRenderer } from "electron";

export type StoredTokens = { accessToken: string; refreshToken: string };

// The renderer runs the same untrusted-ish web code as apps/web/mobile -
// contextIsolation keeps it from touching Node/Electron APIs directly. This
// is the only bridge it gets: encrypted token storage, backed by the main
// process's safeStorage calls (see electron/main.ts).
contextBridge.exposeInMainWorld("electronAuth", {
  getTokens: (): Promise<StoredTokens | null> => ipcRenderer.invoke("auth:getTokens"),
  setTokens: (tokens: StoredTokens): Promise<void> => ipcRenderer.invoke("auth:setTokens", tokens),
  clearTokens: (): Promise<void> => ipcRenderer.invoke("auth:clearTokens"),
});
