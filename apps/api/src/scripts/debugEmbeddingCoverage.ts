import mongoose from "mongoose";
import { connectMongo, disconnectMongo } from "../db/mongoose.js";

async function main() {
  await connectMongo();
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB not connected");

  const coll = db.collection("beneficios");
  const total = await coll.countDocuments();
  const withEmb = await coll.countDocuments({
    embedding: { $type: "array", $ne: [] },
  });
  const sample = await coll.findOne(
    { embedding: { $type: "array", $ne: [] } },
    { projection: { embedding_dim: 1, embedding_model: 1 } },
  );

  // eslint-disable-next-line no-console
  console.log({
    total,
    withEmb,
    embedding_dim: sample?.embedding_dim,
    embedding_model: sample?.embedding_model,
  });

  await disconnectMongo();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});

