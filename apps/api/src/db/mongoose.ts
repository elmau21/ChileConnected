import mongoose from "mongoose";
import { env } from "../config.js";

export async function connectMongo(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;

  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB });
}

export async function disconnectMongo(): Promise<void> {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
}

