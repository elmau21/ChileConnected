import type { FastifyInstance } from "fastify";
import { z } from "zod";
import mongoose from "mongoose";
import { UsuarioModel } from "../models/usuario.js";
import { BeneficioModel } from "../models/beneficio.js";
import { RecomendacionModel } from "../models/recomendacion.js";
import { evaluarBeneficio, type Perfil } from "../reco/rules.js";
import { normalizeRut } from "../utils/rut.js";
import { encrypt, hashForLookup, isEncryptionAvailable } from "../utils/crypto.js";

export async function registerEvaluarRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/evaluar",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (req) => {
    const body = z
      .object({
        rut: z
          .string()
          .trim()
          .min(3)
          .transform((v) => normalizeRut(v))
          .refine((v): v is string => v !== null, { message: "RUT inválido" }),
        perfil: z
          .object({
            edad: z.number().int().min(0).max(120).optional(),
            ingresos_mensuales: z.number().int().min(0).optional(),
            region: z.string().min(2).optional(),
            situacion_laboral: z
              .enum(["empleado", "desempleado", "independiente", "estudiante", "jubilado", "otro"])
              .optional(),
            carga_familiar: z.number().int().min(0).max(20).optional(),
            discapacidad: z.boolean().optional(),
            embarazada: z.boolean().optional(),
            pueblo_originario: z.boolean().optional(),
          })
          .default({}),
        limit: z.number().int().min(1).max(50).default(20),
      })
      .parse(req.body);

    const perfil = body.perfil as Perfil;
    const now = new Date();
    const useEncryption = isEncryptionAvailable();
    const rutHash = hashForLookup(body.rut);
    const rutEncrypted = useEncryption ? encrypt(body.rut) : null;
    const query = useEncryption
      ? { $or: [{ rut_hash: rutHash }, { rut: body.rut }] }
      : { rut: body.rut };
    const setFields: Record<string, unknown> = {
      perfil,
      updated_at: now,
      ...(useEncryption && rutEncrypted
        ? { rut_hash: rutHash, rut_encrypted: rutEncrypted }
        : { rut: body.rut }),
    };
    const updateOp: Record<string, unknown> = {
      $set: setFields,
      $setOnInsert: { created_at: now },
    };
    if (useEncryption && rutEncrypted) {
      updateOp.$unset = { rut: "" };
    }
    const u = await UsuarioModel.findOneAndUpdate(
      query,
      updateOp as any,
      { upsert: true, new: true },
    );
    const usuarioId = String(u._id);

    // Para una MVP robusta: evalúa sobre beneficios abiertos primero.
    const beneficios = await BeneficioModel.find({}).limit(500).lean();
    const evals = beneficios.map((b: any) => evaluarBeneficio(b, perfil));

    // Orden: elegible > posible > no_elegible
    const rank = { elegible: 0, posible: 1, no_elegible: 2 } as const;
    evals.sort((a, b) => rank[a.resultado] - rank[b.resultado]);
    const top = evals.slice(0, body.limit);

    // Enriquecer con metadata del beneficio para UI (evita N requests del frontend)
    const ids = top.map((t) => t.beneficio_id).filter(Boolean);
    const benefits = await BeneficioModel.find({ _id: { $in: ids } })
      .select({ nombre: 1, fuente_url: 1, fuente: 1, estado: 1, monto: 1, fecha_inicio: 1, fecha_fin: 1 })
      .lean();
    const byId = new Map(benefits.map((b: any) => [String(b._id), b]));

    const recDocs = top.map((e) => ({
      usuario_id: usuarioId ? new mongoose.Types.ObjectId(usuarioId) : undefined,
      rut: body.rut,
      perfil_snapshot: perfil,
      beneficio_id: e.beneficio_id,
      resultado: e.resultado,
      razon: e.razon,
      created_at: new Date(),
    }));

    // Guarda recomendaciones (best-effort)
    await RecomendacionModel.insertMany(recDocs, { ordered: false }).catch(() => {});

    const recomendaciones = top.map((t) => ({
      ...t,
      beneficio: byId.get(t.beneficio_id),
    }));

    return { usuario_id: usuarioId, recomendaciones };
  },
  );
}

