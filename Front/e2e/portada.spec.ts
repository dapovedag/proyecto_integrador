/**
 * Portada: el problema, qué se hizo y el checklist del enunciado (47/47, todo marcado) se ven en escritorio y
 * en móvil, sin desplazamiento horizontal ni peticiones fuera del propio origen.
 */
import { expect, test } from "@playwright/test";

test.describe("portada", () => {
  test("problema, solución y checklist completos", async ({ page, baseURL }) => {
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

    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("¿Pagará?");

    const problema = page.locator("#problema");
    await problema.scrollIntoViewIfNeeded();
    await expect(problema.getByRole("heading", { level: 2 })).toContainText("Prestar es decidir hoy");
    await expect(problema.locator(".costo-error")).toHaveCount(3);
    await expect(problema.locator(".problema__cita")).toContainText("estimar la probabilidad de impago");

    const solucion = page.locator("#solucion");
    await solucion.scrollIntoViewIfNeeded();
    await expect(solucion.locator(".fase-sol")).toHaveCount(5);
    await expect(solucion.locator(".garantia")).toHaveCount(5);

    const checklist = page.locator("#checklist");
    await checklist.scrollIntoViewIfNeeded();
    await expect(checklist.getByRole("heading", { level: 2 })).toContainText("47 de 47 requisitos");
    await expect(checklist.locator(".chk-item")).toHaveCount(47);
    await expect(checklist.locator(".chk-item__marca--no")).toHaveCount(0);
    await expect(checklist.locator(".chk-bloque")).toHaveCount(9);
    await expect(checklist.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "47");

    // Cada ítem lleva al capítulo que lo acredita.
    await checklist.locator(".chk-item", { hasText: "IA3.6" }).click();
    await expect(page).toHaveURL(/\/paso\/9$/);

    await page.goto("/", { waitUntil: "networkidle" });
    const anchoPagina = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(anchoPagina).toBeLessThanOrEqual(0);
    expect(errores).toEqual([]);
    expect(externas).toEqual([]);
  });
});
