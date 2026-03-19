import { connectMongo, disconnectMongo } from "../db/mongoose.js";
import { BeneficioModel } from "../models/beneficio.js";

async function main() {
  await connectMongo();
  const doc = await BeneficioModel.findOne({ embedding: { $type: "array", $exists: true } })
    .select({ nombre: 1, fuente_url: 1, embedding: 1 })
    .lean();
  if (!doc) throw new Error("No embedding doc found");
  const emb = (doc as any).embedding as any[];
  const nonFinite = emb.filter((x) => typeof x !== "number" || !Number.isFinite(x)).length;
  // eslint-disable-next-line no-console
  console.log({
    nombre: doc.nombre,
    fuente_url: doc.fuente_url,
    len: emb.length,
    first3: emb.slice(0, 3),
    last3: emb.slice(-3),
    nonFinite,
    type0: typeof emb[0],
  });
  await disconnectMongo();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});

