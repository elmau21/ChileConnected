const url = "https://www.chileatiende.gob.cl/instituciones/AJ008";

async function main() {
  const r = await fetch(url, { headers: { "user-agent": "ChileConnectedBot/1.0" } });
  const html = await r.text();
  // eslint-disable-next-line no-console
  console.log("status", r.status, "len", html.length);
  const matches = html.match(/\/fichas[^"'\s>]*/g) ?? [];
  // eslint-disable-next-line no-console
  console.log("fichasMatches", matches.length);
  // eslint-disable-next-line no-console
  console.log("sample", matches.slice(0, 20));

  const apiMatches = html.match(/https?:\/\/[^"']+|\/api\/[^"'\s<]+|\/busc[^"'\s<]+|\/fichas\?[^"'\s<]+/gi) ?? [];
  // eslint-disable-next-line no-console
  console.log("apiLikeMatches", apiMatches.slice(0, 30));
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});

