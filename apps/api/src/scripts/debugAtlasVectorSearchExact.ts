import { connectMongo, disconnectMongo } from "../db/mongoose.js";
import { env } from "../config.js";
import { BeneficioModel } from "../models/beneficio.js";
import mongoose from "mongoose";

async function main() {
  await connectMongo();

  // Usamos el embedding exacto de un documento como queryVector.
  const doc = await BeneficioModel.findOne({ nombre: "Bono de Protección" }).lean();
  if (!doc?.embedding || !Array.isArray(doc.embedding)) throw new Error("Doc embedding no encontrado");

  const queryVectorRaw = doc.embedding as number[];
  const queryVector = queryVectorRaw.map((x) => Math.fround(x));
  console.log("queryVectorLen", queryVector.length, "first3", queryVector.slice(0, 3));

  if (!mongoose.connection.db) throw new Error("Mongo db undefined");
  const col = mongoose.connection.db.collection("beneficios");

  const pipeline = [
    {
      $vectorSearch: {
        index: env.ATLAS_VECTOR_INDEX,
        path: "embedding",
        queryVector,
        numCandidates: 50,
        limit: 3,
      },
    },
    { $project: { _id: 1, nombre: 1, fuente_url: 1, score: { $meta: "vectorSearchScore" } } },
  ];

  const docs = (await col.aggregate(pipeline).toArray()) as any[];
  console.log("docsLen", docs.length);
  console.log(docs);

  await disconnectMongo();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});

