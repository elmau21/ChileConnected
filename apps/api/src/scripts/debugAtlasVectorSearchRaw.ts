import mongoose from "mongoose";
import { env } from "../config.js";
import { connectMongo, disconnectMongo } from "../db/mongoose.js";
import { getEmbedding } from "../embeddings/embedder.js";

async function main() {
  const q = "bono discapacidad";
  const emb = await getEmbedding(q);

  await connectMongo();
  const clientDb = mongoose.connection.db;
  if (!clientDb) throw new Error("MongoDB no conectado (db undefined).");

  const col = clientDb.collection("beneficios");

  const pipeline = [
    {
      $vectorSearch: {
        index: env.ATLAS_VECTOR_INDEX,
        path: "embedding",
        queryVector: emb.vector,
        numCandidates: 500,
        limit: 10,
      },
    },
    {
      $project: {
        _id: 1,
        nombre: 1,
        fuente_url: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ];

  const docs = (await col.aggregate(pipeline).toArray()) as any[];
  // eslint-disable-next-line no-console
  console.log("embLen", emb.vector.length, "embSample", emb.vector.slice(0, 3));
  console.log("rawDocsLen", docs.length);
  // eslint-disable-next-line no-console
  console.log("rawDocs", docs.slice(0, 3));

  await disconnectMongo();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});

