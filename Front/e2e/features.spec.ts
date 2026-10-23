/**
 * E2E de las features interactivas: reproductor de notebooks (nb05 completo), simulador y consola de la API,
 * todo sin ninguna petición fuera del propio origen.
 */
import { expect, test, type Page } from "@playwright/test";

async function vigilarRed(page: Page, origen: string) {
  const externas: string[] = [];
  const errores: string[] = [];
  await page.route("**/*", (route) => {
    const u = new URL(route.request().url());
    if (u.origin !== origen && u.protocol !== "data:" && u.protocol !== "blob:") {
      externas.push(u.href);
      return route.abort();
    }
    return route.continue();
  });
  page.on("pageerror", (e) => errores.push(e.message));
  return { externas, errores };
}

test.describe("features sin red externa", () => {
  test("ejecuta el notebook 05 completo en el reproductor", async ({ page, baseURL }) => {
    test.setTimeout(120_000);
    const red = await vigilarRed(page, new URL(baseURL!).origin);
    await page.goto("/paso/5", { waitUntil: "networkidle" });
    const nb = page.locator('[data-testid="notebook-player"][data-nb="05"]').first();
    await nb.scrollIntoViewIfNeeded();
    await expect(nb).toHaveAttribute("data-hechas", "0");
    const total = Number(await nb.getAttribute("data-total"));
    expect(total).toBeGreaterThan(5);
    await expect(nb.locator(".nb-prompt").first()).toHaveText("[ ]:");

    await nb.getByRole("button", { name: "Ejecutar todo", exact: true }).click();
    await expect(nb).toHaveAttribute("data-kernel", "ocupado");
    await expect(nb.locator('.nb-prompt:text("[*]:")').first()).toBeVisible();
    await expect(nb).toHaveAttribute("data-hechas", String(total), { timeout: 70_000 });
    await expect(nb).toHaveAttribute("data-kernel", "inactivo");
    // contadores reales y salidas reveladas
    const prompts = await nb.locator(".nb-prompt").allTextContents();
    expect(prompts.every((p) => /^\[\d+\]:$/.test(p))).toBe(true);
    await expect(nb.locator("[data-salida=html] table").first()).toBeVisible();
    await expect(nb.locator("[data-salida=figura]").first()).toBeAttached();
    await expect(nb.locator(".nb-celda__tiempo").filter({ hasText: "real" }).first()).toBeVisible();

    expect(red.externas).toEqual([]);
    expect(red.errores).toEqual([]);
  });

  test("simulador: clientes demo, validación 422 y JSON exacto", async ({ page, baseURL }) => {
    const red = await vigilarRed(page, new URL(baseURL!).origin);
    await page.goto("/simulador", { waitUntil: "networkidle" });
    const res = page.getByTestId("sim-resultado");
    await expect(res).toHaveAttribute("data-decision", "revisar");
    await page.getByTestId("demo-bajo").click();
    await expect(res).toHaveAttribute("data-decision", "aprobar");
    await page.getByTestId("demo-alto").click();
    await expect(res).toHaveAttribute("data-decision", "rechazar");
    await expect(res).toContainText("Rechazar");

    const edad = page.getByLabel("Edad", { exact: true });
    await edad.fill("999");
    await expect(res).toHaveAttribute("data-decision", "invalido");
    await expect(page.getByText("Debe ser menor o igual a 100").first()).toBeVisible();
    await page.getByRole("tab", { name: /Respuesta · 422/ }).click();
    await expect(page.locator(".sim-json__codigo")).toContainText("less_than_equal");

    await page.getByTestId("demo-medio").click();
    await expect(res).toHaveAttribute("data-decision", "revisar");
    await page.getByLabel("Variable a barrer").selectOption("uso_cupo_tarjetas");
    await expect(page.locator(".sim-panel--quesi [data-tipo=lineas]")).toBeVisible();

    expect(red.externas).toEqual([]);
    expect(red.errores).toEqual([]);
  });

  test("consola de la API: reproduce una captura, prueba /predict (200 y 422) y Docker", async ({ page, baseURL }) => {
    const red = await vigilarRed(page, new URL(baseURL!).origin);
    await page.goto("/paso/10", { waitUntil: "networkidle" });
    const api = page.getByTestId("api-console").first();
    await api.scrollIntoViewIfNeeded();

    await api.getByRole("button", { name: "Reproducir llamada" }).click();
    await expect(api.locator(".apic__resumen")).toContainText("200 OK", { timeout: 10_000 });
    await expect(api.locator(".apic__resumen")).toContainText("X-Request-ID");

    await api.getByRole("tab", { name: "Probar" }).click();
    await api.getByRole("button", { name: "edad = 999 · Viajes" }).click();
    await api.getByTestId("api-enviar").click();
    const resp = api.getByTestId("api-respuesta");
    await expect(resp).toContainText("422 Unprocessable Entity");
    await expect(resp).toContainText("literal_error");

    await api.getByRole("button", { name: "Cliente bajo" }).click();
    await api.getByTestId("api-enviar").click();
    await expect(resp).toContainText("200 OK");
    await expect(resp).toContainText('"aprobar"');

    await api.getByRole("tab", { name: "Docker" }).click();
    const docker = api.getByTestId("api-docker");
    await docker.getByRole("button", { name: "Ver todo" }).click();
    await expect(docker).toContainText("healthy");

    expect(red.externas).toEqual([]);
    expect(red.errores).toEqual([]);
  });
});
