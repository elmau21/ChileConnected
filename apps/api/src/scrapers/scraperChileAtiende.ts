import * as cheerio from "cheerio";
import pLimit from "p-limit";
import { env } from "../config.js";
import { BeneficioModel } from "../models/beneficio.js";
import { assertRobotsAllowed, normalizeText, parseDateCL, parseMontoCLP } from "./utils.js";
import { getRenderedHtml, gotoWithRetry, openBrowserPool } from "./browser.js";
import type { BeneficioInput } from "./types.js";

// Nota: /fichas (raíz) puede devolver 404; usamos seeds estables.
// Además, instituciones tiene paginación y muchos links a fichas.
const START_URLS = [
  "https://www.chileatiende.gob.cl/fichas/mas-votadas",
  "https://www.chileatiende.gob.cl/fichas/mas-consultadas",
];

function normalizeChileAtiendeFichaUrl(inputUrl: string): string | null {
  try {
    const u = new URL(inputUrl);
    // Canonical: /fichas/<id>
    const m = u.pathname.match(/^\/fichas\/(?:fichas\/)?(\d+)/);
    if (!m) return null;
    const id = m[1]!;
    return `https://www.chileatiende.gob.cl/fichas/${id}`;
  } catch {
    return null;
  }
}

function inferEstado(text: string): "abierto" | "cerrado" {
  const t = text.toLowerCase();
  if (t.includes("cerrad") || t.includes("no disponible") || t.includes("finaliz")) return "cerrado";
  return "abierto";
}

function extractFromFicha(url: string, html: string): BeneficioInput | null {
  const $ = cheerio.load(html);
  const title =
    $("h1").first().text().trim() ||
    $("meta[property='og:title']").attr("content")?.trim() ||
    "";
  if (!title) return null;
  if (title === "404" || title.toLowerCase().includes("error") || title.toLowerCase().includes("404")) return null;

  const mainText = normalizeText($("main").text());
  if (!mainText) return null;

  const desc =
    normalizeText(
      $("main p")
        .slice(0, 3)
        .toArray()
        .map((p) => $(p).text())
        .join("\n"),
    ) || "Sin descripción disponible.";

  const requisitos = $("main li")
    .toArray()
    .map((li) => normalizeText($(li).text()))
    .filter(Boolean)
    .slice(0, 40);

  const fecha_inicio = parseDateCL(
    mainText.match(/inicio[^0-9]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i)?.[1] ?? "",
  );
  const fecha_fin = parseDateCL(
    mainText.match(/t[eé]rmino[^0-9]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i)?.[1] ?? "",
  );
  const monto = parseMontoCLP(mainText);
  const estado = inferEstado(mainText);

  const out: BeneficioInput = {
    nombre: title,
    descripcion: desc,
    requisitos,
    estado,
    fuente_url: url,
    fuente: "chileatiende",
  };
  if (fecha_inicio) out.fecha_inicio = fecha_inicio;
  if (fecha_fin) out.fecha_fin = fecha_fin;
  if (monto != null) out.monto = monto;
  return out;
}

function discoverFichasFromListing(html: string, baseUrl: string): { fichas: string[]; next?: string } {
  const $ = cheerio.load(html);
  const fichas = new Set<string>();

  $("a[href]")
    .toArray()
    .forEach((a) => {
      const href = $(a).attr("href")?.trim();
      if (!href) return;
      try {
        const u = new URL(href, baseUrl);
        const normalized = normalizeChileAtiendeFichaUrl(u.toString());
        if (normalized) {
          fichas.add(normalized);
        }
      } catch {
        // ignore
      }
    });

  const nextHref = $("a[rel='next']").attr("href") || $("a:contains('Siguiente')").attr("href") || undefined;
  const next = nextHref ? new URL(nextHref, baseUrl).toString() : undefined;

  return next ? { fichas: Array.from(fichas), next } : { fichas: Array.from(fichas) };
}

function isChileAtiendeHost(u: URL): boolean {
  return u.hostname === "www.chileatiende.gob.cl" || u.hostname === "chileatiende.gob.cl";
}

function isListingCandidate(u: URL): boolean {
  if (!isChileAtiendeHost(u)) return false;
  // Evitar /instituciones: no expone fichas en HTML y solo infla la cola.
  if (!u.pathname.startsWith("/fichas")) return false;
  // Mantener crawling acotado a rankings/paginación.
  if (!u.pathname.startsWith("/fichas/mas-")) return false;
  // Excluir fichas canónicas /fichas/<id>
  if (/^\/fichas\/\d+/.test(u.pathname)) return false;
  return true;
}

function discoverLinksFromPage(
  html: string,
  baseUrl: string,
): { fichas: string[]; listings: string[]; next?: string } {
  const $ = cheerio.load(html);
  const fichas = new Set<string>();
  const listings = new Set<string>();

  $("a[href]")
    .toArray()
    .forEach((a) => {
      const href = $(a).attr("href")?.trim();
      if (!href) return;
      try {
        const u = new URL(href, baseUrl);
        if (!isChileAtiendeHost(u)) return;
        u.hash = "";

        const ficha = normalizeChileAtiendeFichaUrl(u.toString());
        if (ficha) {
          fichas.add(ficha);
          return;
        }
        if (isListingCandidate(u)) listings.add(u.toString());
      } catch {
        // ignore
      }
    });

  const nextHref = $("a[rel='next']").attr("href") || $("a:contains('Siguiente')").attr("href") || undefined;
  const next = nextHref ? new URL(nextHref, baseUrl).toString() : undefined;
  if (next) {
    try {
      const nu = new URL(next);
      if (isListingCandidate(nu)) listings.add(next);
    } catch {
      // ignore
    }
  }

  return next ? { fichas: Array.from(fichas), listings: Array.from(listings), next } : { fichas: Array.from(fichas), listings: Array.from(listings) };
}

export async function scrapeChileAtiende(options?: { maxListPages?: number; maxFichas?: number }): Promise<{
  upserted: number;
  listPages: number;
  fichasScanned: number;
}> {
  // eslint-disable-next-line no-console
  console.log("[chileatiende] start", { seeds: START_URLS.length });
  // asegura robots para todos los seeds
  for (const u of START_URLS) await assertRobotsAllowed(u);

  // Más coverage por defecto
  const maxListPages = options?.maxListPages ?? 120;
  const maxFichas = options?.maxFichas ?? 2500;

  const fichaUrls: string[] = [];
  let listPages = 0;

  // Pool de páginas para visitar fichas con concurrencia controlada
  const concurrency = Math.max(1, Math.min(6, env.SCRAPE_CONCURRENCY));
  const { pages, close } = await openBrowserPool(concurrency);
  try {
    // Limpia fichas 404 previamente guardadas (evita contaminar UI/búsqueda)
    await BeneficioModel.deleteMany({ fuente: "chileatiende", nombre: "404" }).catch(() => {});

    // 1) Descubrimiento (crawler BFS) de páginas "listado" para maximizar coverage.
    const visitedListings = new Set<string>();
    const queue: string[] = [];
    for (const s of START_URLS) queue.push(s);

    while (queue.length > 0 && listPages < maxListPages && fichaUrls.length < maxFichas) {
      const listUrl = queue.shift()!;
      if (visitedListings.has(listUrl)) continue;
      visitedListings.add(listUrl);

      // eslint-disable-next-line no-console
      console.log("[chileatiende][list]", { listPages: listPages + 1, url: listUrl });
      await assertRobotsAllowed(listUrl);
      await gotoWithRetry(pages[0]!, listUrl);

      try {
        const html = await getRenderedHtml(pages[0]!);
        const { fichas, listings } = discoverLinksFromPage(html, listUrl);

        for (const f of fichas) {
          if (fichaUrls.length >= maxFichas) break;
          if (!fichaUrls.includes(f)) fichaUrls.push(f);
        }

        for (const l of listings) {
          if (visitedListings.has(l)) continue;
          if (queue.length > maxListPages * 4) break; // control de memoria/cola
          queue.push(l);
        }
      } catch {
        // seguimos con el resto de la cola
      }

      listPages++;
      if (listPages % 10 === 0) {
        // eslint-disable-next-line no-console
        console.log("[chileatiende][discover]", {
          listPages,
          fichaUrls: fichaUrls.length,
          visitedListings: visitedListings.size,
          queue: queue.length,
        });
      }
    }

    // 2) Visitar fichas y upsert
    let upserted = 0;
    const limit = pLimit(concurrency);
    let fichasScanned = 0;
    const targets = fichaUrls.slice(0, maxFichas);

    await Promise.all(
      targets.map((url, idx) =>
        limit(async () => {
          const page = pages[idx % pages.length]!;
          try {
            await assertRobotsAllowed(url);
            await gotoWithRetry(page, url);
            const html = await getRenderedHtml(page);
            const doc = extractFromFicha(url, html);
            fichasScanned++;
            if (!doc) return;

            const now = new Date();
            const res = await BeneficioModel.updateOne(
              { fuente_url: doc.fuente_url },
              { $set: { ...doc, updated_at: now }, $setOnInsert: { scraped_at: now } },
              { upsert: true },
            );
            if (res.upsertedCount > 0 || res.modifiedCount > 0) upserted++;
          } catch {
            // Ignoramos errores puntuales de navegación/parseo para maximizar coverage.
          }
        }),
      ),
    );

    return { upserted, listPages, fichasScanned };
  } finally {
    await close();
  }
}

