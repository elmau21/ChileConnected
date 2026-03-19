import { z } from "zod";
import dotenv from "dotenv";

// Carga .env desde el root del repo (independiente del cwd).
dotenv.config({ path: new URL("../../../.env", import.meta.url) });
dotenv.config({ path: new URL("../../../.env.local", import.meta.url) });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),

  MONGODB_URI: z.string().min(1),
  MONGODB_DB: z.string().min(1).default("chileconnected"),

  GROQ_API_KEY: z.string().min(1).optional(),
  GROQ_MODEL: z.string().min(1).default("llama-3.3-70b-versatile"),

  USE_ATLAS_VECTOR: z.coerce.boolean().default(false),
  ATLAS_VECTOR_INDEX: z.string().min(1).default("beneficios_embedding_v1"),

  // Auto-mantenimiento (RAG)
  AUTO_EMBED_BACKFILL: z.coerce.boolean().default(false),
  AUTO_EMBED_MAX_PER_RUN: z.coerce.number().int().min(1).max(5000).default(250),
  AUTO_EMBED_INTERVAL_MS: z.coerce.number().int().min(30_000).max(86_400_000).default(5 * 60_000),

  SCRAPE_USER_AGENT: z.string().min(1).default("ChileConnectedBot/1.0"),
  SCRAPE_HEADLESS: z.coerce.boolean().default(true),
  SCRAPE_CONCURRENCY: z.coerce.number().int().min(1).max(8).default(2),
  // Anti-golpe: aunque haya concurrencia, se limita el ritmo por host.
  SCRAPE_MIN_HOST_INTERVAL_MS: z.coerce.number().int().min(200).max(20_000).default(1200),

  // Cifrado at-rest para datos sensibles (RUT, etc.). 32 bytes en hex (64 chars) o base64 (44 chars).
  ENCRYPTION_KEY: z.string().min(32).optional(),

  // HyDE (Hypothetical Document Embeddings) para mejorar recuperación en RAG.
  HYDE_ENABLED: z.coerce.boolean().default(true),
  HYDE_MAX_CHARS: z.coerce.number().int().min(200).max(3000).default(900),
});

export const env = envSchema.parse(process.env);

