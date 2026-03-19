import * as cheerio from "cheerio";

const url = "https://www.chileatiende.gob.cl/fichas/mas-votadas";

async function main() {
  const r = await fetch(url, { headers: { "user-agent": "ChileConnectedBot/1.0" } });
  const html = await r.text();
  const $ = cheerio.load(html);
  const links = $("a[href]")
    .toArray()
    .map((a) => $(a).attr("href") || "")
    .filter(Boolean)
    .map((h) => new URL(h, url).toString());

  const fichas = links
    .filter((h) => h.includes("/fichas/"))
    .filter((h) => !h.includes("/fichas/mas-") && !h.includes("/fichas/mas_"))
    .slice(0, 40);
  const listPages = links.filter((h) => h.includes("/fichas/mas-")).slice(0, 40);

  // eslint-disable-next-line no-console
  console.log("status", r.status, "links", links.length);
  // eslint-disable-next-line no-console
  console.log("listPages sample", Array.from(new Set(listPages)).slice(0, 20));
  // eslint-disable-next-line no-console
  console.log("fichas sample", Array.from(new Set(fichas)).slice(0, 20));
  // eslint-disable-next-line no-console
  console.log("next", $("a[rel='next']").attr("href"));
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});

