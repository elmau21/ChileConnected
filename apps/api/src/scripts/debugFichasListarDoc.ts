import * as cheerio from "cheerio";

const url = "https://www.chileatiende.gob.cl/desarrolladores/fichas/fichas_listar";

async function main() {
  const r = await fetch(url, { headers: { "user-agent": "ChileConnectedBot/1.0" } });
  const html = await r.text();
  const $ = cheerio.load(html);

  const text = $("main").text().replace(/\s+/g, " ").trim();
  // eslint-disable-next-line no-console
  console.log("status", r.status);
  // eslint-disable-next-line no-console
  console.log("mainTextSnippet", text.slice(0, 800));

  const pres = $("pre, code")
    .toArray()
    .map((el) => $(el).text().trim())
    .filter(Boolean)
    .filter((t) => t.includes("http") || t.includes("/api") || t.includes("access_token") || t.includes("fichas"));

  // eslint-disable-next-line no-console
  console.log("codeBlocks", pres.slice(0, 20));
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});

