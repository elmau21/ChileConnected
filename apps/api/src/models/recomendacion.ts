import mongoose, { type InferSchemaType } from "mongoose";

const recomendacionSchema = new mongoose.Schema(
  {
    usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: false, index: true },
    rut: { type: String, required: false, index: true, trim: true },
    perfil_snapshot: { type: Object, required: true },
    beneficio_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Beneficio",
      required: true,
      index: true,
    },
    resultado: { type: String, enum: ["elegible", "posible", "no_elegible"], required: true, index: true },
    razon: { type: String, required: true },
    created_at: { type: Date, required: true, default: () => new Date() },
  },
  { minimize: false, timestamps: false },
);

recomendacionSchema.index({ rut: 1, created_at: -1 });

export type Recomendacion = InferSchemaType<typeof recomendacionSchema>;

export const RecomendacionModel =
  (mongoose.models.Recomendacion as mongoose.Model<Recomendacion>) ||
  mongoose.model<Recomendacion>("Recomendacion", recomendacionSchema, "recomendaciones");

