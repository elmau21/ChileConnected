import Groq from "groq-sdk";
import { env } from "../config.js";

let groqClient: Groq | undefined;

export function getGroq(): Groq {
  if (!env.GROQ_API_KEY) {
    throw new Error("Falta GROQ_API_KEY en variables de entorno.");
  }
  if (!groqClient) {
    groqClient = new Groq({ apiKey: env.GROQ_API_KEY });
  }
  return groqClient;
}

export async function chatWithGroq(args: {
  system: string;
  context: string;
  question: string;
  history?: { role: "user" | "assistant"; content: string }[];
}): Promise<string> {
  const groq = getGroq();
  const completion = await groq.chat.completions.create({
    model: env.GROQ_MODEL,
    messages: [
      { role: "system", content: args.system },
      ...(args.history ?? []),
      {
        role: "user",
        content: `Contexto (beneficios recuperados):\n${args.context}\n\nPregunta del usuario:\n${args.question}`,
      },
    ],
    temperature: 0.2,
  });

  return completion.choices?.[0]?.message?.content ?? "No pude generar respuesta.";
}

