import mongoose from "mongoose";
import { connectMongo, disconnectMongo } from "../db/mongoose.js";
import { BeneficioModel } from "../models/beneficio.js";
import { getEmbedding } from "../embeddings/embedder.js";
import { cosineSimilarity } from "../embeddings/similarity.js";

async function main() {
  const q = "bono discapacidad";
  const emb = await getEmbedding(q);
  console.log("queryEmb dim", emb.vector.length);

  await connectMongo();
  const candidates = await BeneficioModel.find({ embedding: { $type: "array" } })
    .select({ nombre: 1, descripcion: 1, requisitos: 1, fuente_url: 1, fuente: 1, embedding: 1 })
    .limit(200)
    .lean();

  console.log("candidates", candidates.length);

  const scored = candidates
    .map((d) => {
      const b = (d as any).embedding as number[] | undefined;
      if (!b || !b.length) return null;
      const score = cosineSimilarity(emb.vector, b);
      return { nombre: (d as any).nombre, score, fuente_url: (d as any).fuente_url };
    })
    .filter(Boolean) as { nombre: string; score: number; fuente_url: string }[];

  scored.sort((a, b) => b.score - a.score);
  console.log("scoredCount", scored.length);
  console.log("top5", scored.slice(0, 5));

  await disconnectMongo();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});

