"use client";

import { useState } from "react";
import Link from "next/link";
import { evaluar, loginRut, type Perfil } from "../lib/api";
import { getFriendlyErrorMessage } from "../lib/errors";
import { Field } from "./ui/Field";
import {
  BadgeCheck, Briefcase, Calendar, ChevronDown, ChevronUp,
  ChevronRight, DollarSign, IdCard, MapPin, Users, UserCircle2,
  FileDown, RefreshCw, Sparkles,
} from "lucide-react";

const regiones = [
  "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo",
  "Valparaíso", "Metropolitana", "O'Higgins", "Maule", "Ñuble",
  "Biobío", "La Araucanía", "Los Ríos", "Los Lagos", "Aysén", "Magallanes",
];

function normalizeRut(input: string): string | null {
  const raw = input.trim().toUpperCase();
  if (!raw) return null;
  const cleaned = raw.replace(/[.\s]/g, "");
  const hasDash = cleaned.includes("-");
  let numPart = "";
  let dvPart = "";

  if (hasDash) {
    const [n, dv] = cleaned.split("-");
    numPart = n ?? "";
    dvPart = dv ?? "";
  } else {
    numPart = cleaned.slice(0, -1);
    dvPart = cleaned.slice(-1);
  }

  if (!numPart || !/^\d+$/.test(numPart)) return null;
  if (!dvPart || !/^[0-9K]$/.test(dvPart)) return null;

  let dvExpected: string;
  const digits = numPart
    .split("")
    .reverse()
    .map((d) => Number(d));
  let factor = 2;
  let sum = 0;
  for (const digit of digits) {
    sum += digit * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }

  const remainder = sum % 11;
  const dvCalc = 11 - remainder;
  if (dvCalc === 11) dvExpected = "0";
  else if (dvCalc === 10) dvExpected = "K";
  else dvExpected = String(dvCalc);

  if (dvPart !== dvExpected) return null;
  return `${numPart}-${dvExpected}`;
}

type EvalItem = {
  beneficio_id: string;
  resultado: "elegible" | "posible" | "no_elegible";
  razon: string;
  beneficio?: {
    _id: string;
    nombre: string;
    fuente_url: string;
    fuente: "midesof" | "chileatiende";
    estado: "abierto" | "cerrado";
    monto?: number;
  };
};

/* ── Stepper progress bar ─────────────────────────── */
function StepBar({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
      {[1, 2].map((n) => (
        <div key={n} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 26, height: 26, borderRadius: "50%",
              display: "grid", placeItems: "center",
              fontSize: 11, fontWeight: 700,
              background: step >= n ? "var(--ink)" : "var(--card-hover)",
              color: step >= n ? "var(--card)" : "var(--muted)",
              border: step >= n ? "none" : "1px solid var(--border)",
              boxShadow: step >= n ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.3s ease",
            }}
          >
            {n}
          </div>
          <span style={{ fontSize: 11, color: step >= n ? "var(--ink)" : "var(--muted)", fontWeight: 500 }}>
            {n === 1 ? "Datos básicos" : "Características"}
          </span>
          {n < 2 && (
            <div style={{
              width: 32, height: 1,
              background: step >= 2 ? "var(--ink)" : "var(--border)",
              borderRadius: 1, marginLeft: 2,
              transition: "background 0.4s ease",
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Custom toggle pill ────────────────────────────── */
function TogglePill({
  label, active, onToggle, emoji,
}: { label: string; active: boolean; onToggle: () => void; emoji: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`toggle-pill ${active ? "active" : ""}`}
    >
      {/* Custom checkbox indicator */}
      <span
        style={{
          width: 16, height: 16, borderRadius: 5, flexShrink: 0,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: active ? "var(--ink)" : "var(--card-hover)",
          border: `1.5px solid ${active ? "var(--ink)" : "var(--border)"}`,
          transition: "all 0.2s ease",
        }}
      >
        {active && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="var(--card)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span>{emoji}</span>
      {label}
    </button>
  );
}

/* ── Main component ───────────────────────────────── */
export function Evaluador() {
  const [step, setStep] = useState(1);
  const [rut, setRut] = useState("");
  const [perfil, setPerfil] = useState<Perfil>({});
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<EvalItem[]>([]);
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const rutPreview = rut.trim() ? normalizeRut(rut.trim()) : null;
  const rutIsValid = rutPreview != null;

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const r = rut.trim();
      if (!r) throw new Error("RUT obligatorio");
      const normalized = normalizeRut(r);
      if (!normalized) throw new Error("RUT inválido");
      setRut(normalized);

      // "Registro / sesión" basada en RUT: aseguramos que el usuario exista
      // y persistimos su RUT en el navegador para reutilizarlo en el chat.
      const auth = await loginRut({ rut: normalized });
      try {
        localStorage.setItem("cc_rut", auth.rut);
        localStorage.setItem("cc_usuario_id", auth.usuario_id);
      } catch {
        // ignore storage errors (modo incógnito / cookies bloqueadas)
      }

      const res = await evaluar({ rut: normalized, perfil, limit: 20 });
      setItems(res.recomendaciones);
      setHasEvaluated(true);
    } catch (e: any) {
      setError(getFriendlyErrorMessage(e, "evaluar"));
    } finally {
      setLoading(false);
    }
  }

  /* Individual field icon padding */
  const pl = "42px";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <StepBar step={step} />

      {/* ── STEP 1: Datos básicos ── */}
      {step === 1 && (
        <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="eval-basic-grid">
            <Field label="RUT" icon={<IdCard size={14} />} value={rut}>
              {({ id, ...a }) => (
                <input
                  id={id} {...a}
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  placeholder="12.345.678-9"
                  style={{ paddingLeft: pl }}
                />
              )}
            </Field>
            <Field label="Edad" icon={<Calendar size={14} />} value={perfil.edad}>
              {({ id, ...a }) => (
                <input
                  id={id} {...a}
                  type="number"
                  value={perfil.edad ?? ""}
                  onChange={(e) => setPerfil((p) => ({ ...p, edad: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="35"
                  style={{ paddingLeft: pl }}
                />
              )}
            </Field>
            <Field label="Ingresos mensuales (CLP)" icon={<DollarSign size={14} />} value={perfil.ingresos_mensuales}>
              {({ id, ...a }) => (
                <input
                  id={id} {...a}
                  type="number"
                  value={perfil.ingresos_mensuales ?? ""}
                  onChange={(e) => setPerfil((p) => ({ ...p, ingresos_mensuales: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="500000"
                  style={{ paddingLeft: pl }}
                />
              )}
            </Field>
            <Field label="Región" icon={<MapPin size={14} />} value={perfil.region}>
              {({ id, ...a }) => (
                <select
                  id={id} {...a}
                  value={perfil.region ?? ""}
                  onChange={(e) => setPerfil((p) => ({ ...p, region: e.target.value || undefined }))}
                  style={{ paddingLeft: pl }}
                >
                  <option value=""> </option>
                  {regiones.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              )}
            </Field>
            <Field label="Situación laboral" icon={<Briefcase size={14} />} value={perfil.situacion_laboral}>
              {({ id, ...a }) => (
                <select
                  id={id} {...a}
                  value={perfil.situacion_laboral ?? ""}
                  onChange={(e) => setPerfil((p) => ({ ...p, situacion_laboral: (e.target.value as any) || undefined }))}
                  style={{ paddingLeft: pl }}
                >
                  <option value=""> </option>
                  <option value="empleado">Empleado</option>
                  <option value="independiente">Independiente</option>
                  <option value="desempleado">Desempleado</option>
                  <option value="estudiante">Estudiante</option>
                  <option value="jubilado">Jubilado</option>
                  <option value="otro">Otro</option>
                </select>
              )}
            </Field>
            <Field label="Carga familiar" icon={<Users size={14} />} value={perfil.carga_familiar}>
              {({ id, ...a }) => (
                <input
                  id={id} {...a}
                  type="number"
                  value={perfil.carga_familiar ?? ""}
                  onChange={(e) => setPerfil((p) => ({ ...p, carga_familiar: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="0"
                  style={{ paddingLeft: pl }}
                />
              )}
            </Field>
          </div>
          <button
            type="button"
            className="btn-gradient"
            onClick={() => setStep(2)}
            disabled={!rutIsValid}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px", fontSize: 13, alignSelf: "flex-start", marginTop: 4,
              border: "none",
              cursor: !rutIsValid ? "not-allowed" : "pointer",
              fontWeight: 600,
              opacity: !rutIsValid ? 0.6 : 1,
            }}
          >
            Siguiente
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* ── STEP 2: Características ── */}
      {step === 2 && (
        <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
            Selecciona las características que apliquen a tu caso. Afectan directamente los beneficios disponibles.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <TogglePill label="Discapacidad" emoji="♿" active={!!(perfil as any).discapacidad}
              onToggle={() => setPerfil((p) => ({ ...p, discapacidad: !(p as any).discapacidad }))} />
            <TogglePill label="Embarazo" emoji="🤱" active={!!(perfil as any).embarazada}
              onToggle={() => setPerfil((p) => ({ ...p, embarazada: !(p as any).embarazada }))} />
            <TogglePill label="Pueblo originario" emoji="🪶" active={!!(perfil as any).pueblo_originario}
              onToggle={() => setPerfil((p) => ({ ...p, pueblo_originario: !(p as any).pueblo_originario }))} />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "11px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                background: "var(--card)", border: "1px solid var(--border)",
                color: "var(--muted)", cursor: "pointer", transition: "all 0.18s ease",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
              }}
            >
              ← Volver
            </button>
            <button
              onClick={run}
              disabled={loading}
              className="btn-gradient"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px", fontSize: 13 }}
            >
              <BadgeCheck size={15} />
              {loading ? "Evaluando…" : "Evaluar perfil"}
            </button>
            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <p style={{ fontSize: 12, color: "#f87171", margin: 0, flex: "1 1 200px" }}>{error}</p>
                <button
                  type="button"
                  onClick={() => { setError(null); void run(); }}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "8px 14px", fontSize: 12, fontWeight: 600,
                    background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8,
                    color: "var(--ink)", cursor: "pointer",
                  }}
                >
                  <RefreshCw size={14} />
                  Reintentar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EMPTY: evaluación ok pero sin resultados ── */}
      {hasEvaluated && !loading && items.length === 0 && !error && (
        <div
          className="fade-up"
          style={{
            padding: "24px 20px",
            borderTop: "1px solid var(--border)",
            textAlign: "center",
            background: "var(--card-hover)",
            borderRadius: 12,
            border: "1px solid var(--border)",
          }}
        >
          <Sparkles size={32} style={{ color: "var(--muted)", marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: "var(--ink)", fontWeight: 600, margin: "0 0 8px 0" }}>
            No encontramos recomendaciones con tu perfil actual
          </p>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
            Completa más datos (edad, región, situación laboral) o pregunta en el chat por beneficios concretos.
          </p>
          <Link
            href="/chat"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginTop: 14,
              fontSize: 13, fontWeight: 600, color: "#2563EB", textDecoration: "none",
            }}
          >
            Ir a Conecta →
          </Link>
        </div>
      )}

      {/* ── RESULTS ── */}
      {items.length > 0 && (
        <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
              paddingTop: 12, borderTop: "1px solid #E5E7EB",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Resultados
            </span>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{items.length} recomendaciones</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const win = window.open("", "_blank", "width=700,height=800");
                if (!win) return;
                const rows = items.map((it) => {
                  const b = it.beneficio;
                  const monto = b?.monto != null ? ` $${b.monto.toLocaleString("es-CL")}` : "";
                  const link = b?.fuente_url ? `<a href="${b.fuente_url}" target="_blank">Ver fuente</a>` : "";
                  return `<tr><td>${(b?.nombre ?? it.beneficio_id)}</td><td>${it.resultado}</td><td>${b?.estado ?? ""}${monto}</td><td>${link}</td></tr>`;
                }).join("");
                win.document.write(`
<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Recomendaciones — ChileConnected</title>
<style>body{font-family:system-ui,sans-serif;padding:24px;color:#111;max-width:720px;margin:0 auto}
table{border-collapse:collapse;width:100%;margin-top:16px}
th,td{border:1px solid #e5e7eb;padding:10px 12px;text-align:left}
th{background:#f9fafb;font-weight:600}
a{color:#2563eb}
h1{font-size:18px;margin:0 0 8px 0}
p{color:#6b7280;font-size:13px;margin:0}
</style></head><body>
<h1>Mis recomendaciones — ChileConnected</h1>
<p>Generado el ${new Date().toLocaleDateString("es-CL", { dateStyle: "long" })}. ${items.length} beneficios.</p>
<table><thead><tr><th>Beneficio</th><th>Resultado</th><th>Estado / Monto</th><th>Enlace</th></tr></thead><tbody>${rows}</tbody></table>
<p style="margin-top:20px;font-size:11px;color:#9ca3af">ChileConnected — Beneficios sociales Chile. Confirma requisitos en las fuentes oficiales.</p>
</body></html>`);
                win.document.close();
                win.focus();
                setTimeout(() => {
                  win.print();
                  win.close();
                }, 300);
              }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 14px", fontSize: 12, fontWeight: 600,
                background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8,
                color: "var(--muted)", cursor: "pointer", boxShadow: "var(--shadow-sm)",
              }}
            >
              <FileDown size={14} />
              Descargar / Imprimir PDF
            </button>
          </div>

          {items.map((it) => {
            const isExp = expanded[it.beneficio_id];
            return (
              <div key={it.beneficio_id} className="result-card">
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {it.beneficio?.nombre ?? it.beneficio_id}
                    </div>
                    <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {it.beneficio?.fuente && <span className="badge badge-muted">{it.beneficio.fuente}</span>}
                      {it.beneficio?.estado && (
                        <span className={`badge ${it.beneficio.estado === "abierto" ? "badge-green" : "badge-red"}`}>
                          {it.beneficio.estado}
                        </span>
                      )}
                      {it.beneficio?.monto != null && (
                        <span className="badge badge-blue">${it.beneficio.monto.toLocaleString("es-CL")}</span>
                      )}
                      {it.beneficio?.fuente_url && (
                        <a href={it.beneficio.fuente_url} target="_blank" rel="noreferrer"
                          style={{ fontSize: 11, color: "#2563EB", textDecoration: "underline", textDecorationColor: "rgba(37,99,235,0.3)" }}>
                          Ver fuente ↗
                        </a>
                      )}
                    </div>
                  </div>
                  <span className={`badge badge-${it.resultado}`} style={{ flexShrink: 0 }}>{it.resultado}</span>
                </div>
                <button
                  onClick={() => setExpanded((e) => ({ ...e, [it.beneficio_id]: !e[it.beneficio_id] }))}
                  style={{
                    marginTop: 10, display: "inline-flex", alignItems: "center", gap: 4,
                    fontSize: 11, color: "var(--muted)", background: "none", border: "none",
                    cursor: "pointer", padding: 0,
                  }}
                >
                  {isExp ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {isExp ? "Ocultar razón" : "Ver razón"}
                </button>
                {isExp && (
                  <div className="fade-up" style={{
                    marginTop: 8, padding: "10px 12px", borderRadius: 8,
                    background: "var(--card-hover)", border: "1px solid var(--border)",
                    fontSize: 12, color: "var(--muted)", lineHeight: 1.6, whiteSpace: "pre-wrap",
                  }}>
                    {it.razon}
                  </div>
                )}
              </div>
            );
          })}
          <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
            Recomendación basada en reglas heurísticas. Puede mejorar con NLP / clasificación.
          </p>
        </div>
      )}
    </div>
  );
}
