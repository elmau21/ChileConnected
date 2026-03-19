import { connectMongo, disconnectMongo } from "../db/mongoose.js";
import { backfillEmbeddings } from "../embeddings/backfill.js";

async function main(): Promise<void> {
  await connectMongo();
  // Re-embebe “recientes” para reflejar cambios de scrape (nombre/descripcion/requisitos)
  // sin tener que recalcular embeddings de toda la base.
  const updatedAfter = new Date(Date.now() - 15 * 60 * 1000);
  const res = await backfillEmbeddings({
    maxDocs: Number.POSITIVE_INFINITY,
    updatedAfter,
    force: true,
  });
  // eslint-disable-next-line no-console
  console.log(`Embeddings actualizados total: ${res.updated}`);
  await disconnectMongo();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});

