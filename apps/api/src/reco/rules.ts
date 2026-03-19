import type { Beneficio } from "../models/beneficio.js";

export type Perfil = {
  edad?: number;
  ingresos_mensuales?: number;
  region?: string;
  situacion_laboral?: "empleado" | "desempleado" | "independiente" | "estudiante" | "jubilado" | "otro";
  carga_familiar?: number;
  discapacidad?: boolean;
  embarazada?: boolean;
  pueblo_originario?: boolean;
};

export type Evaluacion = {
  beneficio_id: string;
  resultado: "elegible" | "posible" | "no_elegible";
  razon: string;
};

export function evaluarBeneficio(beneficio: Beneficio & { _id: any }, perfil: Perfil): Evaluacion {
  const texto = `${beneficio.nombre}\n${beneficio.descripcion}\n${(beneficio.requisitos ?? []).join("\n")}`.toLowerCase();

  const reglas: { ok: boolean; peso: number; razon: string }[] = [];

  if (perfil.edad != null) {
    if (texto.includes("adulto mayor") || texto.includes("tercera edad")) {
      reglas.push({
        ok: perfil.edad >= 60,
        peso: 3,
        razon: "Requiere ser adulto mayor (>=60).",
      });
    }
    if (texto.includes("niño") || texto.includes("niña") || texto.includes("menor de edad")) {
      reglas.push({ ok: perfil.edad < 18, peso: 2, razon: "Orientado a menores de edad." });
    }
  }

  if (perfil.ingresos_mensuales != null) {
    if (texto.includes("vulnerab") || texto.includes("bajos ingresos") || texto.includes("tramo")) {
      reglas.push({
        ok: perfil.ingresos_mensuales <= 600000,
        peso: 2,
        razon: "Enfoque en vulnerabilidad/bajos ingresos (heurística).",
      });
    }
  }

  if (perfil.region) {
    if (texto.includes(perfil.region.toLowerCase())) {
      reglas.push({ ok: true, peso: 1, razon: "Menciona región asociada." });
    }
  }

  if (perfil.situacion_laboral) {
    if (texto.includes("desemple") || texto.includes("cesant")) {
      reglas.push({
        ok: perfil.situacion_laboral === "desempleado",
        peso: 2,
        razon: "Orientado a situación de desempleo.",
      });
    }
  }

  if (perfil.discapacidad != null && (texto.includes("discap") || texto.includes("invalidez"))) {
    reglas.push({ ok: perfil.discapacidad === true, peso: 3, razon: "Requiere condición de discapacidad/invalidez." });
  }

  if (perfil.embarazada != null && (texto.includes("embaraz") || texto.includes("gestante"))) {
    reglas.push({ ok: perfil.embarazada === true, peso: 2, razon: "Orientado a embarazo/gestación." });
  }

  // Scoring simple: si hay reglas y alguna falla fuerte => no elegible; si hay match parcial => posible.
  const totalPeso = reglas.reduce((s, r) => s + r.peso, 0);
  const okPeso = reglas.filter((r) => r.ok).reduce((s, r) => s + r.peso, 0);

  let resultado: Evaluacion["resultado"] = "posible";
  if (totalPeso === 0) resultado = "posible";
  else if (okPeso === 0) resultado = "no_elegible";
  else if (okPeso / totalPeso >= 0.75) resultado = "elegible";
  else resultado = "posible";

  const razon =
    reglas.length === 0
      ? "No hay suficientes señales para determinar elegibilidad. Revisión manual sugerida."
      : `${resultado.toUpperCase()}: ${reglas
          .map((r) => `${r.ok ? "OK" : "NO"} (${r.peso}) ${r.razon}`)
          .join(" ")}`;

  return { beneficio_id: String(beneficio._id), resultado, razon };
}

