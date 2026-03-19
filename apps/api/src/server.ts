import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import websocket from "@fastify/websocket";
import { z } from "zod";
import { env } from "./config.js";
import { connectMongo } from "./db/mongoose.js";
import { registerBeneficiosRoutes } from "./routes/beneficios.js";
import { registerEvaluarRoutes } from "./routes/evaluar.js";
import { registerChatRoutes } from "./routes/chat.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { getEmbedding } from "./embeddings/embedder.js";
import { retrieveSimilar } from "./embeddings/vectorSearch.js";
import { chatWithGroq } from "./llm/groq.js";
import { HistorialChatModel } from "./models/historialChat.js";
import { normalizeRut } from "./utils/rut.js";
import { backfillEmbeddings } from "./embeddings/backfill.js";
import { buildOutOfDomainAnswer, detectBenefitsDomainIntent, isGreetingQuestion } from "./utils/intent.js";
import { getHyDEVector } from "./utils/hyde.js";

const app: any =
  env.NODE_ENV === "development"
    ? Fastify({
        logger: {
          transport: {
            target: "pino-pretty",
            options: { colorize: true, translateTime: "SYS:standard", singleLine: true },
          },
        },
      })
    : Fastify({ logger: true });

await app.register(cors, { origin: true, credentials: true });
await app.register(rateLimit, {
  max: 120,
  timeWindow: "1 minute",
  keyGenerator: (req: any) => {
    const ip = req.ip ?? req.headers["x-forwarded-for"] ?? req.headers["x-real-ip"] ?? "unknown";
    return Array.isArray(ip) ? ip[0] : String(ip);
  },
});
await app.register(websocket);

app.get("/health", async () => ({ ok: true }));

await registerBeneficiosRoutes(app);
await registerEvaluarRoutes(app);
await registerChatRoutes(app);
await registerAuthRoutes(app);

// WebSocket chat (simple): el cliente manda {session_id, rut?, question}
app.get("/ws/chat", { websocket: true }, (conn: any) => {
  // Dependiendo de la versión/config del plugin, `conn` puede ser el socket directamente
  // o un objeto que contiene `{ socket }`. Normalizamos para evitar conexiones caídas.
  const ws = conn?.socket ?? conn;
  if (!ws || typeof ws.on !== "function" || typeof ws.send !== "function") {
    app.log.error({ connKeys: conn ? Object.keys(conn) : null }, "WS handler: socket no disponible");
    return;
  }

  ws.on("message", async (raw: Buffer) => {
    try {
      const payload = z
        .object({
          session_id: z.string().min(6),
          rut: z
            .string()
            .trim()
            .min(3)
            .transform((v) => normalizeRut(v))
            .refine((v): v is string => v !== null, { message: "RUT inválido" }),
          question: z.string().min(1),
        })
        .parse(JSON.parse(raw.toString("utf8")));

      // Si el usuario saluda (hola, buenos días, gracias, etc),
      // respondemos sin RAG/HyDE/LLM para evitar bloqueos y latencia.
      if (isGreetingQuestion(payload.question)) {
        const now = new Date();
        const answer = buildOutOfDomainAnswer(payload.question);

        await HistorialChatModel.updateOne(
          { session_id: payload.session_id },
          {
            $set: { rut: payload.rut, updated_at: now },
            $push: {
              messages: {
                $each: [
                  { role: "user", content: payload.question, created_at: now },
                  { role: "assistant", content: answer, created_at: now },
                ],
              },
            },
            $setOnInsert: { created_at: now, last_retrieval: [] },
          },
          { upsert: true },
        );

        ws.send(JSON.stringify({ type: "answer", answer, hits: [] }));
        return;
      }

      // Guardia anti-fuera-de-tema: si la pregunta no parece de beneficios,
      // evitamos llamar al LLM con contexto irrelevante.
      const intent = detectBenefitsDomainIntent(payload.question);
      if (!intent.inDomain) {
        const now = new Date();
        const answer = buildOutOfDomainAnswer(payload.question);

        await HistorialChatModel.updateOne(
          { session_id: payload.session_id },
          {
            $set: { rut: payload.rut, updated_at: now },
            $push: {
              messages: {
                $each: [
                  { role: "user", content: payload.question, created_at: now },
                  { role: "assistant", content: answer, created_at: now },
                ],
              },
            },
            $setOnInsert: { created_at: now, last_retrieval: [] },
          },
          { upsert: true },
        );

        ws.send(JSON.stringify({ type: "answer", answer, hits: [] }));
        return;
      }

      const hydeVector = await getHyDEVector(payload.question);
      const queryVector = hydeVector ?? (await getEmbedding(payload.question)).vector;
      const hits = await retrieveSimilar(queryVector, { k: 6 });
      const context = hits
        .map((h) => `${h.nombre}\n${h.descripcion}\nFuente: ${h.fuente_url}\nScore: ${h.score.toFixed(4)}`)
        .join("\n\n---\n\n");

      const historyDoc = await HistorialChatModel.findOne({ session_id: payload.session_id }).lean();
      const historyMsgs =
        historyDoc?.messages
          ?.filter((m: any) => m.role === "user" || m.role === "assistant")
          .slice(-8)
          .map((m: any) => ({ role: m.role, content: m.content })) ?? [];

      const answer = await chatWithGroq({
        system:
          "Tu nombre es Conecta. Eres un asistente virtual de ChileConnected especializado en beneficios sociales de Chile.\n\nEstilo y personalidad:\n- Responde en español de Chile, tono amable, claro y directo.\n- Mantén respuestas concisas: primero lo esencial; luego detalles.\n- No inventes datos. Si algo no está en el contexto, dilo.\n\nComportamiento:\n- Identifica si la consulta es sobre elegibilidad, requisitos, fechas o monto.\n- Si faltan datos para concluir, haz hasta 2 preguntas de seguimiento.\n- Cuando uses información del contexto, cita siempre el `nombre` del beneficio y su `fuente_url`.\n- Si no hay contexto suficiente, sugiere verificar en el sitio oficial.\n\nFormato recomendado:\n1) Resumen\n2) Puntos clave\n3) Fuentes (si aplica)\n4) Próximos pasos",
        context,
        question: payload.question,
        history: historyMsgs,
      });

      const now = new Date();
      await HistorialChatModel.updateOne(
        { session_id: payload.session_id },
        {
          $set: { rut: payload.rut, updated_at: now },
          $push: {
            messages: {
              $each: [
                { role: "user", content: payload.question, created_at: now },
                { role: "assistant", content: answer, created_at: now },
              ],
            },
          },
          $setOnInsert: { created_at: now, last_retrieval: [] },
        },
        { upsert: true },
      );

      ws.send(JSON.stringify({ type: "answer", answer, hits }));
    } catch (err: any) {
      ws.send(JSON.stringify({ type: "error", error: err?.message ?? "Error" }));
    }
  });
});

async function start(): Promise<void> {
  await connectMongo();
  if (env.AUTO_EMBED_BACKFILL) {
    const run = async () => {
      try {
        const res = await backfillEmbeddings({ maxDocs: env.AUTO_EMBED_MAX_PER_RUN });
        if (res.updated > 0) app.log.info({ updated: res.updated }, "AUTO_EMBED_BACKFILL: ok");
      } catch (e: any) {
        app.log.warn({ err: e?.message ?? String(e) }, "AUTO_EMBED_BACKFILL: failed");
      }
    };
    // Dispara una vez y luego en intervalos (no bloquea el arranque).
    void run();
    setInterval(run, env.AUTO_EMBED_INTERVAL_MS).unref?.();
  }
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
}

start().catch((err) => {
  app.log.error(err);
  process.exit(1);
});

