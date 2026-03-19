import { Evaluador } from "../../components/Evaluador";
import { Sparkles } from "lucide-react";

export default function RecomendacionesPage() {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 40, height: 40, borderRadius: 13,
            background: "linear-gradient(135deg, rgba(16,185,129,0.35) 0%, rgba(99,102,241,0.35) 100%)",
            border: "1px solid var(--border)",
            display: "grid", placeItems: "center",
            boxShadow: "0 4px 20px rgba(99,102,241,0.12)",
            flexShrink: 0,
          }}
        >
          <Sparkles size={18} style={{ color: "var(--ink)" }} />
        </div>
        <div>
          <div
            className="font-display"
            style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)" }}
          >
            Recomendaciones
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
            Ingresa tu perfil y evaluamos elegibilidad para beneficios sociales
          </div>
        </div>
      </div>

      {/* Evaluador card */}
      <div
        style={{
          borderRadius: 22,
          border: "1px solid var(--border)",
          background: "linear-gradient(160deg, rgba(16,185,129,0.06) 0%, rgba(99,102,241,0.04) 100%)",
          backdropFilter: "blur(8px)",
          boxShadow: "var(--shadow-card)",
          padding: "28px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute", top: -80, right: -80,
            width: 280, height: 280, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative" }}>
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 4 }}>
              Tu perfil
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
              No dependemos solo del RUT. Completa lo que puedas — más datos = mejores resultados.
            </p>
          </div>
          <Evaluador />
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          borderRadius: 16,
          border: "1px solid var(--border)",
          background: "var(--card-hover)",
          padding: "16px 20px",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 10, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Cómo leer los resultados
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {[
            { label: "Elegible", color: "#10b981", desc: "Cumples señales clave" },
            { label: "Posible", color: "#f59e0b", desc: "Faltan datos o hay ambigüedad" },
            { label: "No elegible", color: "#9CA3AF", desc: "No cumples los requisitos" },
          ].map(({ label, color, desc }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, boxShadow: `0 0 8px ${color}` }} />
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                <strong style={{ color: "var(--ink)", fontWeight: 600 }}>{label}</strong> — {desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
