import { connectMongo, disconnectMongo } from "../db/mongoose.js";
import { scrapeChileAtiende } from "../scrapers/scraperChileAtiende.js";

async function main() {
  await connectMongo();
  const res = await scrapeChileAtiende({ maxListPages: 120, maxFichas: 2500 });
  // eslint-disable-next-line no-console
  console.log("[chileatiende-only]", res);
  await disconnectMongo();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});

