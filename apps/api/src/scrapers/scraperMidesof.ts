import * as cheerio from "cheerio";
import { BeneficioModel } from "../models/beneficio.js";
import { assertRobotsAllowed, normalizeText, parseDateCL, parseMontoCLP } from "./utils.js";
import { getRenderedHtml, gotoWithRetry, openBrowser } from "./browser.js";
import type { BeneficioInput } from "./types.js";

// Nota: Los selectores pueden requerir ajustes si el sitio cambia.
const START_URL = "https://www.midesof.gob.cl/";

function inferEstado(text: string): "abierto" | "cerrado" {
  const t = text.toLowerCase();
  if (t.includes("cerrad") || t.includes("finaliz")) return "cerrado";
  return "abierto";
}

function extractBeneficioFromPage(url: string, html: string): BeneficioInput | null {
  const $ = cheerio.load(html);

  function normalizeForCompare(s: string): string {
    // Quita tildes/diacríticos para comparar cadenas.
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }

  const isGenericVentanilla = (t: string) => normalizeForCompare(t) === "ventanilla unica social";

  // Heurística: el H1 del sitio a veces es genérico; preferimos títulos dentro de `main`.
  const candidateMain =
    normalizeText($("main h1, main h2, main h3").first().text());
  const candidateOg = normalizeText($("meta[property='og:title']").attr("content") ?? "");
  const candidateH1 = normalizeText($("h1").first().text());
  const candidateTitleTag = normalizeText($("title").first().text());

  const candidates = [candidateMain, candidateOg, candidateH1, candidateTitleTag].filter(Boolean);
  const title =
    candidates.find((c) => !isGenericVentanilla(c)) ||
    candidates[0] ||
    "";

  if (!title) return null;

  const desc =
    normalizeText(
      $("main p")
        .slice(0, 3)
        .toArray()
        .map((p) => $(p).text())
        .join("\n"),
    ) ||
    normalizeText($("meta[name='description']").attr("content") ?? "") ||
    "Sin descripción disponible.";

  const requisitos = $("main li")
    .toArray()
    .map((li) => normalizeText($(li).text()))
    .filter(Boolean)
    .slice(0, 30);

  const bodyText = normalizeText($("main").text());
  const fecha_inicio = parseDateCL(
    bodyText.match(/inicio[^0-9]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i)?.[1] ?? "",
  );
  const fecha_fin = parseDateCL(
    bodyText.match(/t[eé]rmino[^0-9]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i)?.[1] ?? "",
  );
  const monto = parseMontoCLP(bodyText);
  const estado = inferEstado(bodyText);

  const out: BeneficioInput = {
    nombre: title,
    descripcion: desc,
    requisitos,
    estado,
    fuente_url: url,
    fuente: "midesof",
  };
  if (fecha_inicio) out.fecha_inicio = fecha_inicio;
  if (fecha_fin) out.fecha_fin = fecha_fin;
  if (monto != null) out.monto = monto;
  return out;
}

async function discoverCandidateLinks(html: string, baseUrl: string): Promise<string[]> {
  const $ = cheerio.load(html);
  const links = new Set<string>();

  $("a[href]")
    .toArray()
    .forEach((a) => {
      const href = $(a).attr("href")?.trim();
      if (!href) return;
      if (href.startsWith("#")) return;
      try {
        const u = new URL(href, baseUrl);
        // heurística: páginas internas relacionadas a programas/beneficios
        const p = u.pathname.toLowerCase();
        if (p.includes("benef") || p.includes("program") || p.includes("bono") || p.includes("subsid")) {
          links.add(u.toString());
        }
      } catch {
        // ignore
      }
    });

  return Array.from(links);
}

export async function scrapeMidesof(options?: { maxPages?: number }): Promise<{ upserted: number; scanned: number }> {
  await assertRobotsAllowed(START_URL);

  const maxPages = options?.maxPages ?? 120;
  const visited = new Set<string>();
  const queue: string[] = [START_URL];
  let scanned = 0;
  let upserted = 0;

  const { page, close } = await openBrowser();
  try {
    while (queue.length && visited.size < maxPages) {
      const url = queue.shift()!;
      if (visited.has(url)) continue;
      visited.add(url);
      scanned++;

      await assertRobotsAllowed(url);
      await gotoWithRetry(page, url);
      const html = await getRenderedHtml(page);

      const doc = extractBeneficioFromPage(url, html);
      if (doc) {
        const now = new Date();
        const res = await BeneficioModel.updateOne(
          { fuente_url: doc.fuente_url },
          { $set: { ...doc, updated_at: now }, $setOnInsert: { scraped_at: now } },
          { upsert: true },
        );
        if (res.upsertedCount > 0 || res.modifiedCount > 0) upserted++;
      }

      const links = await discoverCandidateLinks(html, url);
      for (const l of links) {
        if (!visited.has(l) && queue.length < maxPages * 5) queue.push(l);
      }
    }
  } finally {
    await close();
  }

  return { upserted, scanned };
}

