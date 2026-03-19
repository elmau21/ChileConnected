import mongoose from "mongoose";
import { env } from "../config.js";
import { cosineSimilarity } from "./similarity.js";
import { BeneficioModel, type Beneficio } from "../models/beneficio.js";

export type RetrievalHit = {
  _id: string;
  nombre: string;
  descripcion: string;
  requisitos: string[];
  fuente_url: string;
  fuente: "midesof" | "chileatiende";
  score: number;
};

export async function retrieveSimilar(
  queryEmbedding: number[],
  opts?: { k?: number; minScore?: number },
): Promise<RetrievalHit[]> {
  const k = opts?.k ?? 6;
  const minScore = opts?.minScore ?? 0.2;

  if (env.USE_ATLAS_VECTOR) {
    // Requiere índice Atlas Vector Search creado previamente.
    try {
      const db = mongoose.connection.db;
      if (!db) throw new Error("MongoDB no conectado (db undefined).");
      const col = db.collection("beneficios");
      const pipeline = [
        {
          $vectorSearch: {
            index: env.ATLAS_VECTOR_INDEX,
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: Math.max(80, k * 20),
            limit: k,
          },
        },
        {
          $project: {
            nombre: 1,
            descripcion: 1,
            requisitos: 1,
            fuente_url: 1,
            fuente: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ];
      const docs = (await col.aggregate(pipeline).toArray()) as any[];
      const atlasHits = docs
        .map((d) => ({
          _id: String(d._id),
          nombre: d.nombre ?? "",
          descripcion: d.descripcion ?? "",
          requisitos: d.requisitos ?? [],
          fuente_url: d.fuente_url ?? "",
          fuente: d.fuente ?? "chileatiende",
          score: Number(d.score ?? 0),
        }))
        .filter((d) => d.score >= minScore);

      if (atlasHits.length > 0) return atlasHits;

      // Si Atlas existe pero retorna 0 resultados (por ejemplo índice mal configurado),
      // evitamos dejar el RAG sin contexto.
      // eslint-disable-next-line no-console
      console.warn(
        "[vectorSearch] Atlas devolvió 0 resultados, usando fallback cosine. " +
          `index=${env.ATLAS_VECTOR_INDEX} k=${k} minScore=${minScore}`,
      );
    } catch (e) {
      // Si el índice vectorial no existe o Atlas falla, caemos al fallback manual.
      // eslint-disable-next-line no-console
      console.warn("[vectorSearch] Atlas Vector Search falló, usando fallback cosine:", (e as any)?.message ?? e);
    }
  }

  // Fallback: trae un subset y calcula cosine en Node.
  // Estrategia: preferir docs con embedding, y limitar proyección.
  const candidates = (await BeneficioModel.find({ embedding: { $type: "array" } })
    .select({ nombre: 1, descripcion: 1, requisitos: 1, fuente_url: 1, fuente: 1, embedding: 1 })
    .limit(1200)
    .lean()) as (Beneficio & { _id: any })[];

  const scored = candidates
    .map((d) => {
      const emb = (d as any).embedding as number[] | undefined;
      if (!emb?.length) return null;
      const score = cosineSimilarity(queryEmbedding, emb);
      return {
        _id: String((d as any)._id),
        nombre: d.nombre,
        descripcion: d.descripcion,
        requisitos: d.requisitos ?? [],
        fuente_url: d.fuente_url,
        fuente: d.fuente,
        score,
      } satisfies RetrievalHit;
    })
    .filter(Boolean) as RetrievalHit[];

  scored.sort((a, b) => b.score - a.score);
  return scored.filter((x) => x.score >= minScore).slice(0, k);
}

