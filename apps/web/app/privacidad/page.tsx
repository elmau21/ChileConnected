import Link from "next/link";
import { Shield } from "lucide-react";

export const metadata = {
  title: "Privacidad y uso de datos — ChileConnected",
  description: "Cómo tratamos tu RUT, perfil y conversaciones. Cifrado y transparencia.",
};

export default function PrivacidadPage() {
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: "linear-gradient(135deg, rgba(37,99,235,0.2) 0%, rgba(16,185,129,0.2) 100%)",
            border: "1px solid var(--border)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Shield size={22} style={{ color: "var(--ink)" }} />
        </div>
        <div>
          <h1
            className="font-display"
            style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", margin: 0 }}
          >
            Privacidad y uso de datos
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
            Transparencia sobre qué guardamos y cómo protegemos tu información.
          </p>
        </div>
      </div>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Datos que utilizamos</h2>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>
          <li><strong>RUT</strong>: para identificar tu sesión, guardar tu perfil y asociar recomendaciones y conversaciones. Es obligatorio para usar las recomendaciones y el chat.</li>
          <li><strong>Perfil (edad, ingresos, región, situación laboral, etc.)</strong>: para calcular elegibilidad a beneficios. Se guarda de forma asociada a tu RUT.</li>
          <li><strong>Conversaciones con Conecta</strong>: las preguntas y respuestas del chat se almacenan para mejorar el contexto de la conversación; no se usan para publicidad ni se venden a terceros.</li>
        </ul>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Protección de los datos</h2>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>
          <li>La comunicación con el sitio y la API se realiza por <strong>HTTPS</strong> (cifrado en tránsito).</li>
          <li>Cuando está configurado, el RUT y datos sensibles se almacenan en base de datos usando <strong>cifrado simétrico (AES-256-GCM)</strong> y el RUT no se guarda en texto claro para búsquedas (se usa un hash).</li>
          <li>No vendemos ni compartimos tus datos personales con terceros para marketing.</li>
        </ul>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Retención y tus derechos</h2>
        <p style={{ margin: 0, fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>
          Conservamos los datos mientras el servicio esté activo y sea necesario para el funcionamiento (recomendaciones, historial de chat). Puedes dejar de usar el sitio en cualquier momento. En un entorno controlado (por ejemplo, proyecto académico o interno), la retención puede ajustarse según política del responsable del servicio.
        </p>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Fuentes de los beneficios</h2>
        <p style={{ margin: 0, fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>
          La información de beneficios proviene de fuentes oficiales (por ejemplo Ventanilla Única Social, ChileAtiende, MIDESOF). ChileConnected no sustituye la postulación oficial; las fechas, montos y requisitos deben confirmarse en los sitios oficiales.
        </p>
      </section>

      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
        Si tienes dudas sobre el tratamiento de tus datos, puedes contactar al responsable del proyecto o revisar la normativa chilena aplicable (Ley 19.628).
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
          marginTop: 8,
        }}
      >
        ← Volver al inicio
      </Link>
    </div>
  );
}
