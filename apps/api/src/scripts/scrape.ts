import { connectMongo, disconnectMongo } from "../db/mongoose.js";
import { scrapeChileAtiende } from "../scrapers/scraperChileAtiende.js";
import { scrapeMidesof } from "../scrapers/scraperMidesof.js";

async function main(): Promise<void> {
  await connectMongo();

  const m = await scrapeMidesof();
  // eslint-disable-next-line no-console
  console.log("[midesof]", m);

  const c = await scrapeChileAtiende();
  // eslint-disable-next-line no-console
  console.log("[chileatiende]", c);

  await disconnectMongo();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});

