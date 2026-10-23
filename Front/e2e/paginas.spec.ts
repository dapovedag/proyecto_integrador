/**
 * Páginas editoriales: /metodologia, /paso/1..11 y /trazabilidad cargan su contenido real, sin errores de
 * página ni peticiones fuera del propio origen.
 */
import { expect, test } from "@playwright/test";

const RUTAS = ["/metodologia", ...Array.from({ length: 11 }, (_, i) => `/paso/${i + 1}`), "/trazabilidad"];

test.describe("páginas de capítulos, metodología y trazabilidad", () => {
  for (const ruta of RUTAS) {
    test(`contenido de ${ruta}`, async ({ page, baseURL }) => {
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
      const errores: string[] = [];
      page.on("pageerror", (e) => errores.push(e.message));

      await page.goto(ruta, { waitUntil: "networkidle" });
      await expect(page).toHaveTitle(/Riesgo de crédito/);
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 700) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 40));
        }
      });
      await page.waitForLoadState("networkidle");

      if (ruta === "/trazabilidad") {
        await expect(page.getByRole("heading", { level: 1 })).toContainText("Cada requisito");
        await expect(page.locator("tr.traza-fila")).toHaveCount(47);
        await page.getByRole("tablist", { name: "Módulo" }).getByRole("tab", { name: "M1" }).click();
        await expect(page.locator("tr.traza-fila")).toHaveCount(13);
      } else {
        await expect(page.locator(".cap-intro")).toBeVisible();
        await expect(page.locator(".ficha-bloque").first()).toBeVisible();
        if (ruta.startsWith("/paso/")) {
          await expect(page.getByText("Hallazgos clave").or(page.locator(".recorrido"))).toBeVisible();
          // ninguna figura del capítulo quedó como «faltante»
          await expect(page.locator(".cap-sub .faltante")).toHaveCount(0);
        } else {
          await expect(page.locator(".kanban__col")).toHaveCount(4);
          await expect(page.locator(".adr")).toHaveCount(8);
        }
      }

      expect(externas, `peticiones fuera del origen en ${ruta}:\n${externas.join("\n")}`).toEqual([]);
      expect(errores, `errores de página en ${ruta}`).toEqual([]);
    });
  }
});
