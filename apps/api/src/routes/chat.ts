import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getEmbedding } from "../embeddings/embedder.js";
import { retrieveSimilar } from "../embeddings/vectorSearch.js";
import { chatWithGroq } from "../llm/groq.js";
import { HistorialChatModel } from "../models/historialChat.js";
import { normalizeRut } from "../utils/rut.js";
import { buildOutOfDomainAnswer, detectBenefitsDomainIntent, isGreetingQuestion } from "../utils/intent.js";
import { getHyDEVector } from "../utils/hyde.js";

function buildContext(hits: Awaited<ReturnType<typeof retrieveSimilar>>): string {
  return hits
    .map((h, idx) => {
      const reqs = (h.requisitos ?? []).slice(0, 10).map((r) => `- ${r}`).join("\n");
      return [
        `#(${idx + 1}) ${h.nombre}`,
        `Fuente: ${h.fuente} — ${h.fuente_url}`,
        `Descripción: ${h.descripcion}`,
        reqs ? `Requisitos:\n${reqs}` : "",
        `Score: ${h.score.toFixed(4)}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n---\n\n");
}

export async function registerChatRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/chat",
    { config: { rateLimit: { max: 40, timeWindow: "1 minute" } } },
    async (req) => {
    const body = z
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
      .parse(req.body);

    // Si el usuario saluda, respondemos sin RAG/HyDE/LLM (evita bloqueos y llamadas extra).
    if (isGreetingQuestion(body.question)) {
      const hits: any[] = [];
      await HistorialChatModel.updateOne(
        { session_id: body.session_id },
        {
          $set: { rut: body.rut, updated_at: new Date(), last_retrieval: [] },
          $push: {
            messages: {
              $each: [
                { role: "user", content: body.question, created_at: new Date() },
                { role: "assistant", content: buildOutOfDomainAnswer(body.question), created_at: new Date() },
              ],
            },
          },
          $setOnInsert: { created_at: new Date() },
        },
        { upsert: true },
      );

      return { answer: buildOutOfDomainAnswer(body.question), hits };
    }

    // Guardia anti-fuera-de-tema:
    // Si la pregunta no parece del dominio, no armamos contexto ni llamamos al LLM
    // para evitar respuestas como código / temas no relacionados.
    const intent = detectBenefitsDomainIntent(body.question);
    if (!intent.inDomain) {
      const hits: any[] = [];
      await HistorialChatModel.updateOne(
        { session_id: body.session_id },
        {
          $set: { rut: body.rut, updated_at: new Date(), last_retrieval: [] },
          $push: { messages: { $each: [{ role: "user", content: body.question, created_at: new Date() }, { role: "assistant", content: buildOutOfDomainAnswer(body.question), created_at: new Date() }] } },
          $setOnInsert: { created_at: new Date() },
        },
        { upsert: true },
      );

      return { answer: buildOutOfDomainAnswer(body.question), hits };
    }

    const hydeVector = await getHyDEVector(body.question);
    const queryVector = hydeVector ?? (await getEmbedding(body.question)).vector;
    const hits = await retrieveSimilar(queryVector, { k: 6 });
    const context = buildContext(hits);

    const historyDoc = await HistorialChatModel.findOne({ session_id: body.session_id }).lean();
    const historyMsgs =
      historyDoc?.messages
        ?.filter((m: any) => m.role === "user" || m.role === "assistant")
        .slice(-8)
        .map((m: any) => ({ role: m.role, content: m.content })) ?? [];

    const answer = await chatWithGroq({
      system:
        "Tu nombre es Conecta. Eres un asistente virtual de ChileConnected especializado en beneficios sociales de Chile.\n\nEstilo y personalidad:\n- Responde en español de Chile, con tono amable, claro y directo.\n- Mantén respuestas concisas (primero lo esencial) y usa listas cuando ayuden.\n- No inventes datos: montos, fechas, requisitos o estados solo si aparecen en el contexto.\n\nComportamiento:\n- Si la pregunta trata de elegibilidad, requisitos, fechas o monto, identifícalo explícitamente.\n- Si falta información para concluir, haz hasta 2 preguntas de seguimiento.\n- Cuando uses información del contexto, cita siempre el `nombre` del beneficio y su `fuente_url`.\n- Si el contexto no contiene suficiente info, dilo y sugiere verificar en el sitio oficial del beneficio.\n\nFormato recomendado:\n1) Resumen (2-3 líneas)\n2) Puntos clave\n3) Fuentes (si aplica)\n4) Próximos pasos",
      context,
      question: body.question,
      history: historyMsgs,
    });

    const now = new Date();
    await HistorialChatModel.updateOne(
      { session_id: body.session_id },
      {
        $set: {
          // `body.rut` ya viene normalizado por Zod.
          rut: body.rut,
          updated_at: now,
          last_retrieval: hits.map((h) => ({
            beneficio_id: h._id,
            score: h.score,
            fuente_url: h.fuente_url,
            nombre: h.nombre,
          })),
        },
        $push: {
          messages: {
            $each: [
              { role: "user", content: body.question, created_at: now },
              { role: "assistant", content: answer, created_at: now },
            ],
          },
        },
        $setOnInsert: { created_at: now },
      },
      { upsert: true },
    );

    return { answer, hits };
  },
  );
}

