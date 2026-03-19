export type BeneficioInput = {
  nombre: string;
  descripcion: string;
  requisitos: string[];
  fecha_inicio?: Date;
  fecha_fin?: Date;
  monto?: number;
  estado: "abierto" | "cerrado";
  fuente_url: string;
  fuente: "midesof" | "chileatiende";
};

