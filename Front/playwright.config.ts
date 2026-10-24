import { defineConfig, devices } from "@playwright/test";

const PUERTO = 5181;
// PW_BASE_URL apunta las mismas pruebas a un sitio ya publicado (por ejemplo, la URL de producción en Vercel);
// en ese caso no se levanta el servidor local.
const BASE_REMOTA = process.env.PW_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_REMOTA ?? `http://127.0.0.1:${PUERTO}`,
    trace: "retain-on-failure",
    // Permite usar un Chromium ya instalado (PW_CHROMIUM=ruta\chrome.exe) si falta el de esta versión de Playwright.
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "movil", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
  ],
  webServer: BASE_REMOTA
    ? undefined
    : {
        command: "npm run preview",
        url: `http://127.0.0.1:${PUERTO}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
