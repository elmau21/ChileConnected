import mongoose from "mongoose";
import { connectMongo, disconnectMongo } from "../db/mongoose.js";

async function main() {
  await connectMongo();

  const db = mongoose.connection.db;
  if (!db) throw new Error("Mongo DB handle no disponible");

  const coll = db.collection("beneficios");
  const indexes = await coll.indexes();

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      indexes.map((i) => ({
        name: i.name,
        key: i.key,
        unique: Boolean((i as any).unique),
        weights: (i as any).weights,
        default_language: (i as any).default_language,
      })),
      null,
      2,
    ),
  );

  await disconnectMongo();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});

