import { connectMongo, disconnectMongo } from "../db/mongoose.js";
import mongoose from "mongoose";

async function main() {
  await connectMongo();
  console.log("mongoose db name", mongoose.connection.db?.databaseName);
  console.log("conn host", mongoose.connection.host);
  await disconnectMongo();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});

