import { connectMongo, disconnectMongo } from "../db/mongoose.js";
import { BeneficioModel } from "../models/beneficio.js";
import mongoose from "mongoose";

async function run(indexName: string, label: string) {
  const doc = await BeneficioModel.findOne({ nombre: "Bono de Protección" }).lean();
  if (!doc?.embedding || !Array.isArray(doc.embedding)) throw new Error("Doc embedding no encontrado");

  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB no conectado (db undefined).");
  const col = db.collection("beneficios");

  const pipeline = [
    {
      $vectorSearch: {
        index: indexName,
        path: "embedding",
        queryVector: doc.embedding,
        numCandidates: 50,
        limit: 3,
      },
    },
    { $project: { _id: 1, nombre: 1, fuente_url: 1, score: { $meta: "vectorSearchScore" } } },
  ];

  const docs = (await col.aggregate(pipeline).toArray()) as any[];
  // eslint-disable-next-line no-console
  console.log(label, { docsLen: docs.length, docs: docs.slice(0, 2) });
}

async function main() {
  await connectMongo();
  await run("vector-index", "correctIndex");
  await run("vector-index-EXTRA", "wrongIndex");
  await disconnectMongo();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});

