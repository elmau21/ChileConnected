import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { BeneficioModel } from "../models/beneficio.js";

export async function registerBeneficiosRoutes(app: FastifyInstance): Promise<void> {
  app.get("/beneficios", async (req) => {
    const q = z
      .object({
        q: z.string().optional(),
        fuente: z.enum(["midesof", "chileatiende"]).optional(),
        estado: z.enum(["abierto", "cerrado"]).optional(),
        limit: z.coerce.number().int().min(1).max(100).default(30),
        offset: z.coerce.number().int().min(0).default(0),
      })
      .parse(req.query);

    const filter: any = {};
    if (q.fuente) filter.fuente = q.fuente;
    if (q.estado) filter.estado = q.estado;

    let cursor = BeneficioModel.find(filter).select({
      nombre: 1,
      descripcion: 1,
      requisitos: 1,
      fecha_inicio: 1,
      fecha_fin: 1,
      monto: 1,
      estado: 1,
      fuente_url: 1,
      fuente: 1,
      scraped_at: 1,
      updated_at: 1,
    });

    if (q.q) {
      cursor = cursor.find({ $text: { $search: q.q } }).sort({ score: { $meta: "textScore" } });
    } else {
      cursor = cursor.sort({ updated_at: -1 });
    }

    const items = await cursor.skip(q.offset).limit(q.limit).lean();
    return { items, limit: q.limit, offset: q.offset };
  });

  app.get("/beneficios/:id", async (req, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    const doc = await BeneficioModel.findById(params.id).lean();
    if (!doc) return reply.code(404).send({ error: "Not found" });
    return doc;
  });
}

