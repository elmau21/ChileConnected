import * as cheerio from "cheerio";

const url = "https://www.chileatiende.gob.cl/desarrolladores/access_token";

async function main() {
  const r = await fetch(url, { headers: { "user-agent": "ChileConnectedBot/1.0" } });
  const html = await r.text();
  const $ = cheerio.load(html);
  const text = $("main").text().replace(/\s+/g, " ").trim();
  // eslint-disable-next-line no-console
  console.log("status", r.status);
  // eslint-disable-next-line no-console
  console.log("snippet", text.slice(0, 1200));

  const blocks = $("pre, code")
    .toArray()
    .map((el) => $(el).text().trim())
    .filter(Boolean)
    .filter((t) => t.includes("POST") || t.includes("GET") || t.includes("token") || t.includes("/api"));
  // eslint-disable-next-line no-console
  console.log("blocks", blocks.slice(0, 30));
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});

