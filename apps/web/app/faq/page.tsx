"use client";

import Link from "next/link";
import { useState } from "react";
import { HelpCircle, ChevronDown, ChevronRight } from "lucide-react";

const items: { q: string; a: string }[] = [
  {
    q: "¿Es seguro ingresar mi RUT?",
    a: "Sí. El RUT es obligatorio para usar recomendaciones y el chat. La conexión es por HTTPS y, cuando está configurado, el RUT se guarda cifrado en base de datos (AES-256-GCM). No usamos tu RUT para publicidad ni lo vendemos a terceros.",
  },
  {
    q: "¿De dónde sale la información de los beneficios?",
    a: "De fuentes oficiales: Ventanilla Única Social, ChileAtiende y el Ministerio de Desarrollo Social y Familia (MIDESOF). Los datos se actualizan mediante procesos automatizados; siempre conviene confirmar fechas, montos y requisitos en los sitios oficiales.",
  },
  {
    q: "¿Puedo postular a un beneficio desde ChileConnected?",
    a: "No. ChileConnected te ayuda a descubrir beneficios y a ver criterios de elegibilidad aproximados. La postulación real se hace en los portales oficiales (por ejemplo ChileAtiende o la Ventanilla Única Social). Te damos los enlaces para que puedas ir directo a la fuente.",
  },
  {
    q: "¿Qué es Conecta y cómo funciona el chat?",
    a: "Conecta es el asistente de chat del sitio. Responde preguntas sobre beneficios sociales en Chile usando búsqueda por similitud (RAG) sobre la base de beneficios y un modelo de lenguaje. Las respuestas intentan citar fuentes cuando aplica; no sustituyen la información oficial.",
  },
  {
    q: "¿Qué significan Elegible, Posible y No elegible?",
    a: "Son indicadores aproximados según tu perfil: Elegible = cumples señales clave del beneficio; Posible = hay ambigüedad o faltan datos; No elegible = no cumples los requisitos considerados. Son orientativos; la elegibilidad final la determina el organismo al postular.",
  },
  {
    q: "¿Guardan mis conversaciones del chat?",
    a: "Sí. Guardamos preguntas y respuestas para mantener el contexto de la conversación y mejorar el servicio. No se usan para publicidad ni se comparten con terceros. Puedes revisar nuestra página de Privacidad para más detalle.",
  },
];

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        background: open ? "var(--card-hover)" : "var(--card)",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 18px",
          textAlign: "left",
          border: "none",
          background: "none",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--ink)",
        }}
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown size={18} style={{ flexShrink: 0, color: "var(--muted)" }} />
        ) : (
          <ChevronRight size={18} style={{ flexShrink: 0, color: "var(--muted)" }} />
        )}
        {q}
      </button>
      {open && (
        <div
          style={{
            padding: "0 18px 16px 44px",
            fontSize: 14,
            color: "var(--muted)",
            lineHeight: 1.65,
          }}
        >
          {a}
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: "linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(99,102,241,0.2) 100%)",
            border: "1px solid var(--border)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <HelpCircle size={22} style={{ color: "var(--ink)" }} />
        </div>
        <div>
          <h1
            className="font-display"
            style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", margin: 0 }}
          >
            Preguntas frecuentes
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
            Dudas sobre RUT, beneficios, Conecta y privacidad.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((item, i) => (
          <FaqItem
            key={i}
            q={item.q}
            a={item.a}
            open={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? null : i)}
          />
        ))}
      </div>

      <p style={{ fontSize: 13, color: "var(--muted)" }}>
        <Link href="/privacidad" style={{ color: "#2563EB", textDecoration: "underline" }}>
          Ver Privacidad y uso de datos
        </Link>
      </p>

      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
          color: "#2563EB",
          textDecoration: "none",
        }}
      >
        ← Volver al inicio
      </Link>
    </div>
  );
}
