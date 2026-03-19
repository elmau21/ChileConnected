import * as cheerio from "cheerio";

async function main() {
  const base = "https://www.chileatiende.gob.cl/fichas/mas-votadas";
  const r = await fetch(base, { headers: { "user-agent": "ChileConnectedBot/1.0" } });
  console.log("status", r.status);
  const html = await r.text();
  console.log("len", html.length);
  const $ = cheerio.load(html);
  const hrefs = $("a[href]")
    .toArray()
    .map((el) => $(el).attr("href"))
    .filter(Boolean) as string[];
  const abs = Array.from(
    new Set(
      hrefs
        .map((h) => {
          try {
            return new URL(h, base).toString();
          } catch {
            return null;
          }
        })
        .filter(Boolean) as string[],
    ),
  );
  const fichas = abs.filter((u) => {
    try {
      const p = new URL(u).pathname;
      return p.startsWith("/fichas/") && /\/fichas\/(\d+)(-|$)/.test(p);
    } catch {
      return false;
    }
  });
  console.log("anchors", hrefs.length, "uniqueAbs", abs.length, "fichas", fichas.length);
  console.log("sample", fichas.slice(0, 20));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

