import mongoose from "mongoose";
import { connectMongo, disconnectMongo } from "../db/mongoose.js";

async function main() {
  await connectMongo();
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB not connected");
  const coll = db.collection("beneficios");

  const agg = await coll
    .aggregate([
      {
        $project: {
          len: { $cond: [{ $isArray: "$embedding" }, { $size: "$embedding" }, 0] },
          hasEmb: { $isArray: "$embedding" },
          t: { $type: "$embedding" },
        },
      },
      {
        $group: {
          _id: "$len",
          count: { $sum: 1 },
          hasEmbCount: { $sum: { $cond: ["$hasEmb", 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ])
    .toArray();

  const empty = await coll.countDocuments({
    $or: [{ embedding: { $exists: false } }, { embedding: { $size: 0 } }],
  });

  const total = await coll.countDocuments();

  const sample = await coll.findOne(
    { $expr: { $gt: [{ $size: { $ifNull: ["$embedding", []] } }, 0] } },
    { projection: { embedding_dim: 1, embedding_model: 1, embedding: 1 } },
  );

  // eslint-disable-next-line no-console
  console.log({ total, empty, agg, sampleDim: sample?.embedding_dim, sampleModel: sample?.embedding_model, sampleVecLen: sample?.embedding?.length });

  await disconnectMongo();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});

