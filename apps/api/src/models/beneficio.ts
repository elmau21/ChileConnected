import mongoose, { type InferSchemaType } from "mongoose";

const beneficioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, index: true },
    descripcion: { type: String, required: true, trim: true },
    requisitos: { type: [String], required: true, default: [] },
    fecha_inicio: { type: Date, required: false },
    fecha_fin: { type: Date, required: false },
    monto: { type: Number, required: false },
    estado: { type: String, enum: ["abierto", "cerrado"], required: true, index: true },
    fuente_url: { type: String, required: true, unique: true },
    fuente: { type: String, enum: ["midesof", "chileatiende"], required: true, index: true },
    embedding: { type: [Number], required: false, default: undefined },
    embedding_model: { type: String, required: false },
    embedding_dim: { type: Number, required: false },
    scraped_at: { type: Date, required: true, default: () => new Date() },
    updated_at: { type: Date, required: true, default: () => new Date() },
  },
  { minimize: false, timestamps: false },
);

beneficioSchema.index({ nombre: "text", descripcion: "text", requisitos: "text" });

export type Beneficio = InferSchemaType<typeof beneficioSchema>;

export const BeneficioModel =
  (mongoose.models.Beneficio as mongoose.Model<Beneficio>) ||
  mongoose.model<Beneficio>("Beneficio", beneficioSchema, "beneficios");

