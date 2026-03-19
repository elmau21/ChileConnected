import { BeneficioModel } from "../models/beneficio.js";
import { getEmbedding } from "./embedder.js";

export async function backfillEmbeddings(
  opts?: {
    maxDocs?: number;
    updatedAfter?: Date;
    force?: boolean; // si true, re-embebe aunque ya exista embedding
  },
): Promise<{ updated: number }> {
  const maxDocs = opts?.maxDocs ?? 250;
  const updatedAfter = opts?.updatedAfter;
  const force = opts?.force ?? false;

  const cursorQuery: any = {};
  if (updatedAfter) {
    cursorQuery.updated_at = { $gte: updatedAfter };
  }

  if (updatedAfter && force) {
    // re-embed de lo “reciente” para reflejar cambios de scrape (nombre/descripcion/requisitos).
  } else {
    cursorQuery.$or = [{ embedding: { $exists: false } }, { embedding: { $size: 0 } }];
  }

  const cursor = BeneficioModel.find(cursorQuery)
    .select({ nombre: 1, descripcion: 1, requisitos: 1, fuente_url: 1 })
    .cursor();

  let updated = 0;
  for await (const doc of cursor) {
    if (updated >= maxDocs) break;
    const text = [
      doc.nombre,
      doc.descripcion,
      ...(doc.requisitos ?? []).slice(0, 10),
      `Fuente: ${doc.fuente_url}`,
    ]
      .filter(Boolean)
      .join("\n");

    const emb = await getEmbedding(text);
    await BeneficioModel.updateOne(
      { _id: doc._id },
      {
        $set: {
          embedding: emb.vector,
          embedding_dim: emb.dim,
          embedding_model: emb.model,
          updated_at: new Date(),
        },
      },
    );
    updated++;
  }

  return { updated };
}

