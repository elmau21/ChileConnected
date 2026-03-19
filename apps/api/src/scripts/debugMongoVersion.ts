import { connectMongo, disconnectMongo } from "../db/mongoose.js";
import mongoose from "mongoose";

async function main() {
  await connectMongo();
  const db = mongoose.connection.db;
  if (!db) throw new Error("db undefined");
  const build = await db.admin().command({ buildInfo: 1 });
  console.log("mongoVersion", build.version);
  await disconnectMongo();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});

