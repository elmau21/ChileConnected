import mongoose, { type InferSchemaType } from "mongoose";

const usuarioSchema = new mongoose.Schema(
  {
    rut: { type: String, required: false, index: true, trim: true },
    rut_hash: { type: String, required: false, index: true },
    rut_encrypted: { type: String, required: false },
    perfil: {
      edad: { type: Number, required: false },
      ingresos_mensuales: { type: Number, required: false },
      region: { type: String, required: false, trim: true },
      situacion_laboral: {
        type: String,
        enum: ["empleado", "desempleado", "independiente", "estudiante", "jubilado", "otro"],
        required: false,
      },
      carga_familiar: { type: Number, required: false },
      discapacidad: { type: Boolean, required: false },
      embarazada: { type: Boolean, required: false },
      pueblo_originario: { type: Boolean, required: false },
    },
    created_at: { type: Date, required: true, default: () => new Date() },
    updated_at: { type: Date, required: true, default: () => new Date() },
  },
  { minimize: false, timestamps: false },
);

usuarioSchema.index({ rut: 1 }, { unique: false });
usuarioSchema.index({ rut_hash: 1 }, { unique: false });

export type Usuario = InferSchemaType<typeof usuarioSchema>;

export const UsuarioModel =
  (mongoose.models.Usuario as mongoose.Model<Usuario>) ||
  mongoose.model<Usuario>("Usuario", usuarioSchema, "usuarios");

