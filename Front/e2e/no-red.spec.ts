/**
 * Prueba de no-red: el sitio es 100 % estático y autónomo. Se abren todas las rutas y se registra CUALQUIER
 * petición; falla si alguna sale del propio origen (CDN, fuentes remotas, APIs, back local, etc.).
 */
import { expect, test } from "@playwright/test";

const RUTAS = ["/", "/metodologia", ...Array.from({ length: 11 }, (_, i) => `/paso/${i + 1}`), "/simulador", "/trazabilidad", "/no-existe"];

test.describe("sin peticiones fuera del propio origen", () => {
  for (const ruta of RUTAS) {
    test(`ruta ${ruta}`, async ({ page, baseURL }) => {
      const origen = new URL(baseURL!).origin;
      const externas: string[] = [];
      await page.route("**/*", (route) => {
        const url = route.request().url();
        const u = new URL(url);
        const propio = u.origin === origen || u.protocol === "data:" || u.protocol === "blob:";
        if (!propio) {
          externas.push(url);
          return route.abort();
        }
        return route.continue();
      });
      const errores: string[] = [];
      page.on("pageerror", (e) => errores.push(e.message));

      await page.goto(ruta, { waitUntil: "networkidle" });
      await expect(page).toHaveTitle(/Riesgo de crédito/);
      await expect(page.locator("main#contenido")).toBeVisible();
      // recorre la página para disparar cargas perezosas (figuras, nube, etc.)
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
      });
      await page.waitForLoadState("networkidle");

      expect(externas, `peticiones fuera del origen en ${ruta}:\n${externas.join("\n")}`).toEqual([]);
      expect(errores, `errores de página en ${ruta}`).toEqual([]);
    });
  }

  test("la paleta de comandos abre y navega sin red externa", async ({ page, baseURL }) => {
    const origen = new URL(baseURL!).origin;
    const externas: string[] = [];
    await page.route("**/*", (route) => {
      const u = new URL(route.request().url());
      if (u.origin !== origen && u.protocol !== "data:" && u.protocol !== "blob:") {
        externas.push(u.href);
        return route.abort();
      }
      return route.continue();
    });
    await page.goto("/");
    await page.keyboard.press("Control+k");
    await expect(page.getByRole("dialog", { name: "Paleta de comandos" })).toBeVisible();
    await page.keyboard.type("IA3.2");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/paso\/6$/);
    expect(externas).toEqual([]);
  });
});
