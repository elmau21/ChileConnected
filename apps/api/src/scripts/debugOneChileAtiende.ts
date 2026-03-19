import * as cheerio from "cheerio";

const url =
  "https://www.chileatiende.gob.cl/fichas/fichas/3337-cedula-de-identidad-para-extranjeros-obtencion-y-renovacion";

async function main() {
  const r = await fetch(url, { headers: { "user-agent": "ChileConnectedBot/1.0" } });
  console.log("status", r.status);
  const html = await r.text();
  const $ = cheerio.load(html);
  const h1 = $("h1").first().text().trim();
  const og = $('meta[property="og:title"]').attr("content");
  console.log("h1", h1);
  console.log("og", og);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

