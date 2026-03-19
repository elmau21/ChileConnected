import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { UsuarioModel } from "../models/usuario.js";
import { normalizeRut } from "../utils/rut.js";
import { encrypt, hashForLookup, decrypt, isEncryptionAvailable } from "../utils/crypto.js";

function resolveRutFromDoc(doc: { rut?: string | null; rut_encrypted?: string | null }): string | null {
  if (doc.rut_encrypted) {
    const dec = decrypt(doc.rut_encrypted);
    if (dec) return dec;
  }
  return doc.rut ?? null;
}

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post("/auth/rut", async (req, reply) => {
    const body = z
      .object({
        rut: z.string().min(3),
      })
      .parse(req.body);

    const normalized = normalizeRut(body.rut);
    if (!normalized) {
      return reply.code(400).send({ message: "RUT inválido" });
    }

    const useEncryption = isEncryptionAvailable();
    const rutHash = hashForLookup(normalized);
    const rutEncrypted = useEncryption ? encrypt(normalized) : null;

    const query = useEncryption
      ? { $or: [{ rut_hash: rutHash }, { rut: normalized }] }
      : { rut: normalized };

    const setFields: Record<string, unknown> = {
      updated_at: new Date(),
      ...(useEncryption && rutEncrypted
        ? { rut_hash: rutHash, rut_encrypted: rutEncrypted }
        : { rut: normalized }),
    };
    const updateOp: Record<string, unknown> = {
      $set: setFields,
      $setOnInsert: { created_at: new Date() },
    };
    if (useEncryption && rutEncrypted) {
      updateOp.$unset = { rut: "" };
    }

    const u = await UsuarioModel.findOneAndUpdate(
      query,
      updateOp as any,
      { upsert: true, new: true },
    );

    const rutToReturn = resolveRutFromDoc(u) ?? normalized;
    return reply.send({ usuario_id: String(u._id), rut: rutToReturn });
  });
}

