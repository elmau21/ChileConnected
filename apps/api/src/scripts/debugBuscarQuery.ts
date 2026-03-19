import * as cheerio from "cheerio";

const url = "https://www.chileatiende.gob.cl/buscar?query=bono";

async function main() {
  const r = await fetch(url, { headers: { "user-agent": "ChileConnectedBot/1.0" } });
  const html = await r.text();
  // eslint-disable-next-line no-console
  console.log("status", r.status, "len", html.length);

  const $ = cheerio.load(html);
  const links = $("a[href]")
    .toArray()
    .map((a) => $(a).attr("href") || "")
    .filter(Boolean);
  // eslint-disable-next-line no-console
  console.log("linksSample", links.slice(0, 40));
  const fichas = links.filter((h) => h.includes("/fichas/"));
  // eslint-disable-next-line no-console
  console.log("fichas", fichas.length, "sample", fichas.slice(0, 20));
  // eslint-disable-next-line no-console
  console.log("next", $("a[rel='next']").attr("href"));
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});

