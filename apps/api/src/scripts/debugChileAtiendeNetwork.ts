import { chromium } from "playwright";

async function main() {
  const url = "https://www.chileatiende.gob.cl/instituciones/AJ008";
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ userAgent: "ChileConnectedBot/1.0", locale: "es-CL" });
  const page = await context.newPage();

  const interesting: string[] = [];
  page.on("response", async (res) => {
    const u = res.url();
    if (
      u.includes("instituciones") ||
      u.includes("fichas") ||
      u.includes("search") ||
      u.includes("api") ||
      u.includes("json")
    ) {
      interesting.push(`${res.status()} ${u}`);
    }
  });

  const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 }).catch(() => null);
  // eslint-disable-next-line no-console
  console.log("goto", resp?.status() ?? null);
  await page.waitForTimeout(2000);

  // eslint-disable-next-line no-console
  console.log("interesting responses:");
  for (const line of interesting.slice(0, 200)) console.log(line);

  await browser.close();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});

