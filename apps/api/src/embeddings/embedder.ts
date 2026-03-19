import { pipeline, env as xenovaEnv } from "@xenova/transformers";

// Ajustes para Node: evita intentar usar WASM SIMD si falla (depende del entorno).
// Xenova cachea modelos en disco automáticamente.
xenovaEnv.allowLocalModels = false;

export type EmbeddingResult = { vector: number[]; dim: number; model: string };

let extractorPromise: Promise<any> | undefined;

export async function getEmbedding(text: string): Promise<EmbeddingResult> {
  const model = "Xenova/all-MiniLM-L6-v2";
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", model) as any;
  }
  const extractor = await extractorPromise;
  const out: any = await extractor(text, { pooling: "mean", normalize: true });
  const arr: number[] = Array.isArray(out) ? out : Array.from(out.data ?? out);
  return { vector: arr, dim: arr.length, model };
}

