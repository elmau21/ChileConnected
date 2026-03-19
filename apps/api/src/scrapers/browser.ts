import { chromium, type Browser, type Page } from "playwright";
import { env } from "../config.js";
import { retry, sleep, throttleByHost, withJitter } from "./utils.js";

export type BrowserContextHandle = {
  browser: Browser;
  page: Page;
  close: () => Promise<void>;
};

export type BrowserPoolHandle = {
  browser: Browser;
  pages: Page[];
  close: () => Promise<void>;
};

export async function openBrowser(): Promise<BrowserContextHandle> {
  const browser = await chromium.launch({ headless: env.SCRAPE_HEADLESS });
  const context = await browser.newContext({
    userAgent: env.SCRAPE_USER_AGENT,
    viewport: { width: 1365, height: 900 },
    locale: "es-CL",
  });
  const page = await context.newPage();

  // Evita cargas pesadas cuando se pueda
  await page.route("**/*", (route) => {
    const rt = route.request().resourceType();
    if (rt === "image" || rt === "media" || rt === "font") return route.abort();
    return route.continue();
  });

  return {
    browser,
    page,
    close: async () => {
      await context.close();
      await browser.close();
    },
  };
}

export async function openBrowserPool(pageCount: number): Promise<BrowserPoolHandle> {
  const browser = await chromium.launch({ headless: env.SCRAPE_HEADLESS });
  const context = await browser.newContext({
    userAgent: env.SCRAPE_USER_AGENT,
    viewport: { width: 1365, height: 900 },
    locale: "es-CL",
  });

  const pages: Page[] = [];
  for (let i = 0; i < pageCount; i++) {
    const p = await context.newPage();
    await p.route("**/*", (route) => {
      const rt = route.request().resourceType();
      if (rt === "image" || rt === "media" || rt === "font") return route.abort();
      return route.continue();
    });
    pages.push(p);
  }

  return {
    browser,
    pages,
    close: async () => {
      await context.close();
      await browser.close();
    },
  };
}

export async function gotoWithRetry(page: Page, url: string): Promise<void> {
  await retry(
    async () => {
      // Anti-ráfagas: aunque haya concurrencia, se controla el ritmo por dominio.
      await throttleByHost(url, env.SCRAPE_MIN_HOST_INTERVAL_MS);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
      // pequeño delay para render dinámico
      await sleep(withJitter(600));
    },
    { retries: 3, baseDelayMs: 800, maxDelayMs: 8_000, label: `goto:${url}` },
  );
}

export async function getRenderedHtml(page: Page): Promise<string> {
  // `page.content()` puede fallar si la página sigue navegando.
  // Esperamos un poco y reintentamos para reducir abortos del scrape.
  return await retry(
    async () => {
      // domcontentloaded suele bastar; networkidle puede no llegar en sitios con polling.
      await page.waitForLoadState("domcontentloaded", { timeout: 15_000 }).catch(() => {});
      await sleep(withJitter(250));
      return await page.content();
    },
    { retries: 4, baseDelayMs: 250, maxDelayMs: 2_000, label: "page.content" },
  );
}

