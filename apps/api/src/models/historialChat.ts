import mongoose, { type InferSchemaType } from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
    created_at: { type: Date, required: true, default: () => new Date() },
  },
  { _id: false, minimize: false, timestamps: false },
);

const retrievalHitSchema = new mongoose.Schema(
  {
    beneficio_id: { type: mongoose.Schema.Types.ObjectId, ref: "Beneficio", required: true },
    score: { type: Number, required: true },
    fuente_url: { type: String, required: true },
    nombre: { type: String, required: true },
  },
  { _id: false, minimize: false, timestamps: false },
);

const historialChatSchema = new mongoose.Schema(
  {
    session_id: { type: String, required: true, index: true },
    rut: { type: String, required: false, index: true, trim: true },
    usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: false, index: true },
    messages: { type: [messageSchema], required: true, default: [] },
    last_retrieval: { type: [retrievalHitSchema], required: true, default: [] },
    created_at: { type: Date, required: true, default: () => new Date() },
    updated_at: { type: Date, required: true, default: () => new Date() },
  },
  { minimize: false, timestamps: false },
);

historialChatSchema.index({ session_id: 1, updated_at: -1 });

export type HistorialChat = InferSchemaType<typeof historialChatSchema>;

export const HistorialChatModel =
  (mongoose.models.HistorialChat as mongoose.Model<HistorialChat>) ||
  mongoose.model<HistorialChat>("HistorialChat", historialChatSchema, "historial_chat");

