import * as cheerio from "cheerio";

const url = "https://www.chileatiende.gob.cl/buscar";

async function main() {
  const r = await fetch(url, { headers: { "user-agent": "ChileConnectedBot/1.0" } });
  const html = await r.text();
  // eslint-disable-next-line no-console
  console.log("status", r.status, "len", html.length);

  const $ = cheerio.load(html);
  const h1 = $("h1").first().text().trim();
  // eslint-disable-next-line no-console
  console.log("h1", h1);

  const links = $("a[href]")
    .toArray()
    .map((a) => $(a).attr("href") || "")
    .filter(Boolean);
  const fichas = links.filter((h) => h.includes("/fichas/")).slice(0, 20);
  // eslint-disable-next-line no-console
  console.log("links", links.length, "fichasLinksSample", fichas);

  const forms = $("form")
    .toArray()
    .map((f) => ({
      action: $(f).attr("action"),
      method: $(f).attr("method"),
      inputs: $(f)
        .find("input[name]")
        .toArray()
        .map((i) => $(i).attr("name")),
    }));
  // eslint-disable-next-line no-console
  console.log("forms", forms.slice(0, 3));
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});

