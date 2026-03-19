import { ChatBox } from "../../components/ChatBox";
import { MessageSquare } from "lucide-react";

export default function ChatPage() {
  return (
    <div
      style={{
        maxWidth: 760,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 40, height: 40, borderRadius: 13,
            background: "linear-gradient(135deg, rgba(16,185,129,0.35) 0%, rgba(59,130,246,0.35) 100%)",
            border: "1px solid var(--border)",
            display: "grid", placeItems: "center",
            boxShadow: "0 4px 20px rgba(16,185,129,0.12)",
            flexShrink: 0,
          }}
        >
          <MessageSquare size={18} style={{ color: "var(--ink)" }} />
        </div>
        <div>
          <div
            className="font-display"
            style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)" }}
          >
            Chat con IA
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
            Groq + RAG · Respuestas con fuentes oficiales
          </div>
        </div>
      </div>

      <ChatBox />
    </div>
  );
}
