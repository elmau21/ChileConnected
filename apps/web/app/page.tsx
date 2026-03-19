import { Evaluador } from "../components/Evaluador";
import { ExploreBeneficios } from "../components/ExploreBeneficios";

import { UserCircle2 } from "lucide-react";

export default function Page() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

      {/* ── PERFIL ── */}
      <div
        className="glass-card"
        style={{
          padding: "24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: "var(--ink)",
                display: "grid", placeItems: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <UserCircle2 size={18} style={{ color: "var(--card)" }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                Mi Perfil
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>
                Completa para evaluar elegibilidad
              </div>
            </div>
          </div>
          <Evaluador />
        </div>
      </div>

      {/* ── EXPLORAR ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <ExploreBeneficios />

        {/* Info card */}
        <div
          style={{
            borderRadius: 16,
            border: "1px solid var(--border)",
            background: "var(--card-hover)",
            padding: "18px 20px",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 10, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Cómo interpretar resultados
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Elegible", color: "#10B981", desc: "Señales fuertes de cumplimiento de requisitos." },
              { label: "Posible", color: "#F59E0B", desc: "Faltan datos o hay cierta ambigüedad." },
              { label: "No elegible", color: "#9CA3AF", desc: "Señales fuertes de no cumplimiento." },
            ].map(({ label, color, desc }) => (
              <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, marginTop: 5 }} />
                <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
                  <strong style={{ color: "var(--ink)", fontWeight: 600 }}>{label}:</strong> {desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
