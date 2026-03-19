import * as cheerio from "cheerio";

const url = "https://www.chileatiende.gob.cl/desarrolladores";

async function main() {
  const r = await fetch(url, { headers: { "user-agent": "ChileConnectedBot/1.0" } });
  const html = await r.text();
  // eslint-disable-next-line no-console
  console.log("status", r.status, "len", html.length);
  const $ = cheerio.load(html);
  const links = $("a[href]")
    .toArray()
    .map((a) => $(a).attr("href") || "")
    .filter(Boolean)
    .map((h) => {
      try {
        return new URL(h, url).toString();
      } catch {
        return h;
      }
    });
  // eslint-disable-next-line no-console
  console.log("links", links);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});

