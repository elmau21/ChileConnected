import { chromium } from "playwright";

const url =
  "https://www.chileatiende.gob.cl/fichas/fichas/3337-cedula-de-identidad-para-extranjeros-obtencion-y-renovacion";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "ChileConnectedBot/1.0",
    locale: "es-CL",
  });
  const page = await context.newPage();

  const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  if (!resp) throw new Error("page.goto returned null response");
  const status = resp.status();
  const html = await page.content();

  // parse mínimo (sin cheerio) para ver h1
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const h1 = h1Match ? (h1Match[1] ?? "").replace(/<[^>]+>/g, "").trim() : "";

  console.log("gotoStatus", status);
  console.log("h1", h1 || "(sin h1)");

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

