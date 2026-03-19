import { env } from "../config.js";
import { chatWithGroq } from "../llm/groq.js";
import { getEmbedding } from "../embeddings/embedder.js";

const HYDE_SYSTEM = [
  "Eres un asistente que prepara documentos hipotéticos SOLO para mejorar búsqueda semántica (RAG).",
  "Tu tarea: escribir un texto hipotético en español de Chile sobre el tipo de beneficio que podría encajar con la pregunta del usuario.",
  "Reglas estrictas:",
  "- No inventes instituciones, programas ni URLs específicas.",
  "- No cites fuentes ni incluyas enlaces.",
  "- Usa términos del propio usuario (reescritura + palabras clave) y categorías generales (elegibilidad, requisitos, fechas típicas, montos genéricos si aplica).",
  "- Máximo 120-150 palabras (o respeta el límite configurado).",
  "- Devuelve únicamente el documento hipotético (texto plano), sin numeraciones ni encabezados tipo 'Respuesta:' .",
].join("\n");

function clampText(input: string): string {
  const maxChars = env.HYDE_MAX_CHARS;
  const cleaned = input.trim().replace(/\s+/g, " ");
  if (cleaned.length <= maxChars) return cleaned;
  return cleaned.slice(0, maxChars).trimEnd();
}

export async function getHyDEVector(question: string): Promise<number[] | null> {
  if (!env.HYDE_ENABLED) return null;

  try {
    const hypothetical = await chatWithGroq({
      system: HYDE_SYSTEM,
      context: "",
      question,
    });

    if (!hypothetical || hypothetical.trim().length < 20) return null;
    const doc = clampText(hypothetical);
    const emb = await getEmbedding(doc);
    return emb.vector ?? null;
  } catch {
    // Si HyDE falla (rate, red, etc.), no rompemos el RAG: caemos al embedding de la pregunta.
    return null;
  }
}

