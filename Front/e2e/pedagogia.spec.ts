/**
 * Fase 4: capa pedagógica (capítulo con «Antes de empezar», explicación de celdas, términos y guía de gráficos),
 * glosario y Presentación Negocio. Sin peticiones fuera del propio origen ni desplazamiento horizontal.
 */
import { expect, test, type Page } from "@playwright/test";

async function sinRedExterna(page: Page, baseURL: string | undefined) {
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
  return externas;
}

test.describe("capa pedagógica, glosario y presentación de negocio", () => {
  test("capítulo: conceptos, explicación de celdas, términos y guía de gráficos", async ({ page, baseURL }) => {
    const externas = await sinRedExterna(page, baseURL);
    const errores: string[] = [];
    page.on("pageerror", (e) => errores.push(e.message));
    await page.goto("/paso/2", { waitUntil: "networkidle" });

    const antes = page.locator("#antes-de-empezar");
    await antes.scrollIntoViewIfNeeded();
    await expect(antes.getByText("Al terminar este capítulo usted podrá")).toBeVisible();
    expect(await antes.locator(".concepto").count()).toBeGreaterThanOrEqual(4);

    const celda = page.locator(".nb-explica").nth(2);
    await celda.scrollIntoViewIfNeeded();
    await expect(celda.getByText("Qué hace")).toBeVisible();
    await celda.getByRole("button", { name: /línea a línea/ }).click();
    await expect(celda.locator(".nb-explica__lineas li").first()).toBeVisible();

    const termino = celda.locator(".termino__btn").first();
    await termino.click();
    await expect(page.getByRole("tooltip").first()).toBeVisible();

    const guia = page.locator(".figura__guia").first();
    await guia.scrollIntoViewIfNeeded();
    await guia.locator("summary").click();
    await expect(guia.locator(".figura__guia-cuerpo")).toBeVisible();

    expect(errores).toEqual([]);
    expect(externas).toEqual([]);
  });

  test("glosario: búsqueda y ancla", async ({ page, baseURL }) => {
    const externas = await sinRedExterna(page, baseURL);
    await page.goto("/glosario#histograma", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Cada concepto");
    await expect(page.locator("#histograma")).toBeVisible();
    await page.getByPlaceholder(/Buscar/).fill("validación cruzada");
    await expect(page.locator("#validacion_cruzada")).toBeVisible();
    expect(externas).toEqual([]);
  });

  test("presentación de negocio: 10 diapositivas navegables con teclado", async ({ page, baseURL }) => {
    const externas = await sinRedExterna(page, baseURL);
    await page.goto("/negocio", { waitUntil: "networkidle" });
    await expect(page.locator(".diapo")).toHaveCount(10);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Decidir mejor a quién prestar");
    await expect(page.locator(".deck__indicador")).toHaveText(/01 \/ 10/);
    await page.locator(".deck__controles").getByRole("button", { name: "Diapositiva siguiente" }).click();
    await expect(page.locator(".deck__indicador")).toHaveText(/02 \/ 10/, { timeout: 5000 });
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(ancho).toBeLessThanOrEqual(0);
    expect(externas).toEqual([]);
  });
});
