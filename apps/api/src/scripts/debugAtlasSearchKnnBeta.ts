import { connectMongo, disconnectMongo } from "../db/mongoose.js";
import { BeneficioModel } from "../models/beneficio.js";

async function main() {
  await connectMongo();
  const doc = await BeneficioModel.findOne({ nombre: "Bono de Protección" }).lean();
  if (!doc?.embedding || !Array.isArray(doc.embedding)) throw new Error("Doc embedding no encontrado");

  const queryVector = doc.embedding as number[];

  const db = (globalThis as any).mongoose?.connection?.db ?? (await import("mongoose")).default.connection.db;
  if (!db) throw new Error("Mongo db undefined");
  const col = db.collection("beneficios");

  const pipeline = [
    {
      $search: {
        index: "vector-index",
        knnBeta: { vector: queryVector, path: "embedding", k: 3 },
      },
    },
    { $project: { _id: 1, nombre: 1, fuente_url: 1, score: { $meta: "searchScore" } } },
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

