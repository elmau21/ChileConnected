"use client";

import { useEffect, useRef, useState } from "react";
import { chat, openChatWs } from "../lib/api";
import { getFriendlyErrorMessage } from "../lib/errors";
import { Bot, Send, User, Wifi, WifiOff, Loader2 } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

function renderAssistantText(content: string) {
  // 1) Detecta URLs para convertirlas en links reales.
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const rawParts = content.split(urlRegex);

  return rawParts
    .filter((p) => p !== undefined && p !== null && p !== "")
    .map((part, idx) => {
      const isUrl = part.startsWith("http://") || part.startsWith("https://");
      if (isUrl) {
        // Limpia puntuación final común sin romper la URL.
        let url = part;
        while (/[.,);!?]$/.test(url)) url = url.slice(0, -1);
        return (
          <a
            // eslint-disable-next-line react/no-array-index-key
            key={`${idx}-url`}
            href={url}
            target="_blank"
            rel="noreferrer"
            style={{
              color: "#2563EB",
              textDecoration: "underline",
              textDecorationColor: "rgba(37,99,235,0.3)",
            }}
          >
            {url}
          </a>
        );
      }

      // 2) Dentro de texto normal, convierte Markdown simple **negrita**.
      const boldRegex = /\*\*(.+?)\*\*/g;
      const boldParts = part.split(boldRegex);
      const nodes: React.ReactNode[] = [];

      for (let i = 0; i < boldParts.length; i++) {
        const chunk = boldParts[i]!;
        if (!chunk) continue;
        const isBold = i % 2 === 1; // por el split con capture
        nodes.push(
          isBold ? (
            <strong key={`${idx}-b-${i}`} style={{ fontWeight: 700, color: "var(--ink)" }}>
              {chunk}
            </strong>
          ) : (
            <span key={`${idx}-t-${i}`}>{chunk}</span>
          ),
        );
      }

      return (
        // eslint-disable-next-line react/no-array-index-key
        <span key={`${idx}-text`}>{nodes}</span>
      );
    });
}

export function ChatBox({ rut }: { rut?: string }) {
  const [sessionId, setSessionId] = useState<string>("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hola, soy Conecta. Pregúntame por beneficios sociales en Chile y te responderé con fuentes oficiales cuando aplique.\n\n¿Buscas elegibilidad, requisitos, fechas o montos?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<"conectando" | "online" | "offline">("conectando");
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [storedRut, setStoredRut] = useState<string | undefined>(undefined);
  const effRut = rut ?? storedRut;
  const hasRut = !!effRut;

  useEffect(() => {
    // Trae RUT desde "sesión" simple guardada por el Evaluador.
    try {
      const v = localStorage.getItem("cc_rut") ?? undefined;
      setStoredRut(v || undefined);
    } catch {
      // ignore storage errors
    }

    setSessionId(crypto.randomUUID());
    const ws = openChatWs();
    wsRef.current = ws;
    setWsStatus("conectando");
    ws.onopen = () => setWsStatus("online");
    ws.onclose = () => setWsStatus("offline");
    ws.onmessage = (ev: MessageEvent) => {
      try {
        const msg = JSON.parse(ev.data as string);
        if (msg?.type === "answer") {
          setMessages((m) => [...m, { role: "assistant", content: msg.answer ?? "" }]);
          setLoading(false);
        }
        if (msg?.type === "error") {
          setMessages((m) => [...m, { role: "assistant", content: `Error: ${msg.error ?? "desconocido"}` }]);
          setLoading(false);
        }
      } catch { /* ignore */ }
    };
    ws.onerror = () => setWsStatus("offline");
    return () => ws.close();
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, loading]);

  async function send() {
    const q = question.trim();
    if (!q || loading || !sessionId) return;
    if (!effRut) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Para ayudarte con beneficios sociales necesito tu RUT (obligatorio). Ve a `Mi Perfil / Evaluar perfil` e ingrésalo.",
        },
      ]);
      return;
    }
    setQuestion("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setLoading(true);
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      const payload: any = { session_id: sessionId, question: q };
      payload.rut = effRut;
      ws.send(JSON.stringify(payload));
      return;
    }
    try {
      const payload: any = { session_id: sessionId, question: q };
      payload.rut = effRut;
      const res = await chat(payload);
      setMessages((m) => [...m, { role: "assistant", content: res.answer }]);
    } catch (e: any) {
      const friendly = getFriendlyErrorMessage(e, "chat");
      setMessages((m) => [...m, { role: "assistant", content: `${friendly}\n\nPuedes intentar de nuevo.` }]);
    } finally {
      setLoading(false);
    }
  }

  const statusColor =
    wsStatus === "online" ? "#10b981" : wsStatus === "conectando" ? "#f59e0b" : "#6b7280";
  const statusLabel =
    wsStatus === "online" ? "Online" : wsStatus === "conectando" ? "Conectando" : "Offline";

  return (
    <section
      className="glass-card"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 620,
        overflow: "hidden",
        position: "relative",
      }}
    >

      {/* ── HEADER ── */}
      <div
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "var(--ink)",
              display: "grid",
              placeItems: "center",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <Bot size={18} style={{ color: "var(--card)" }} />
          </div>
          <div>
            <div
              className="font-display"
              style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ink)" }}
            >
              Conecta
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>
              Sesión {sessionId ? sessionId.slice(0, 8) : "…"}
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "6px 14px",
            borderRadius: 9999,
            background: "var(--card-hover)",
            border: `1px solid ${statusColor}40`,
            fontSize: 12,
            fontWeight: 500,
            color: "var(--muted)",
          }}
        >
          {wsStatus === "online" ? (
            <Wifi size={12} style={{ color: statusColor }} />
          ) : wsStatus === "offline" ? (
            <WifiOff size={12} style={{ color: statusColor }} />
          ) : (
            <Loader2 size={12} style={{ color: statusColor, animation: "spin 1s linear infinite" }} />
          )}
          <span
            className={wsStatus === "online" ? "status-dot-pulse" : ""}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: statusColor,
              boxShadow: `0 0 8px ${statusColor}`,
              display: "inline-block",
            }}
          />
          {statusLabel}
        </div>
      </div>

      {/* ── MESSAGE LIST ── */}
      <div
        ref={scrollerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          position: "relative",
        }}
      >
        {messages.map((m, i) => {
          const isUser = m.role === "user";
          return (
            <div
              key={i}
              className="fade-up"
              style={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
                alignItems: "flex-start",
                gap: 10,
                animationDelay: `${Math.min(i * 0.04, 0.3)}s`,
              }}
            >
              {!isUser && (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: "var(--ink)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <Bot size={14} style={{ color: "var(--card)" }} />
                </div>
              )}
              <div
                style={{
                  maxWidth: "82%",
                  padding: "12px 16px",
                  borderRadius: isUser ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
                  fontSize: 14,
                  lineHeight: 1.65,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  ...(isUser
                    ? {
                        background: "var(--ink)",
                        color: "var(--card)",
                        boxShadow: "var(--shadow-sm)",
                      }
                    : {
                        background: "var(--card-hover)",
                        color: "var(--ink)",
                        border: "1px solid var(--border)",
                        boxShadow: "var(--shadow-sm)",
                      }),
                }}
              >
                {isUser ? m.content : renderAssistantText(m.content)}
              </div>
              {isUser && (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: "var(--card-hover)",
                    border: "1px solid var(--border)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <User size={14} style={{ color: "var(--muted)" }} />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }} className="fade-up">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: "var(--ink)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              <Bot size={14} style={{ color: "var(--card)" }} />
            </div>
            <div
              style={{
                padding: "14px 18px",
                borderRadius: "4px 18px 18px 18px",
                background: "var(--card-hover)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span className="typing-dot" style={{ fontSize: 18, color: "var(--muted)", lineHeight: 1 }}>•</span>
              <span className="typing-dot" style={{ fontSize: 18, color: "var(--muted)", lineHeight: 1 }}>•</span>
              <span className="typing-dot" style={{ fontSize: 18, color: "var(--muted)", lineHeight: 1 }}>•</span>
            </div>
          </div>
        )}
      </div>

      {/* ── INPUT AREA ── */}
      <div
        style={{
          padding: "16px 20px 20px",
          borderTop: "1px solid var(--border)",
          flexShrink: 0,
          position: "relative",
          background: "var(--card-hover)",
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            ref={inputRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Escribe tu pregunta… (Enter para enviar)"
            className="input-glass"
            style={{ padding: "13px 18px", borderRadius: 12, flex: 1, minWidth: 0, background: "var(--card)" }}
          />
          <button
            onClick={send}
            disabled={loading || !sessionId || !question.trim() || !hasRut}
            style={{
              padding: "13px 20px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
              fontSize: 14,
              fontWeight: 600,
              background: loading || !sessionId || !question.trim() || !hasRut ? "var(--card-hover)" : "var(--ink)",
              color: loading || !sessionId || !question.trim() || !hasRut ? "var(--muted)" : "var(--card)",
              borderRadius: 12,
              border: loading || !sessionId || !question.trim() || !hasRut ? "1px solid var(--border)" : "none",
              cursor: loading || !sessionId || !question.trim() || !hasRut ? "not-allowed" : "pointer",
              transition: "all 0.2s ease"
            }}
          >
            <Send size={15} />
            Enviar
          </button>
        </div>
        {!hasRut && (
          <p style={{ marginTop: 8, fontSize: 12, color: "#B45309", lineHeight: 1.4 }}>
            El RUT es obligatorio. Ve a <strong>Mi Perfil</strong> → Evaluar perfil e ingresa tu RUT para poder enviar mensajes.
          </p>
        )}
        <p style={{ marginTop: 10, fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
          Consejo: pide{" "}
          {['"requisitos"', '"monto"', '"fechas"', '"cómo postular"'].map((t, i) => (
            <span key={i}>
              <span
                style={{
                  background: "var(--border)",
                  borderRadius: 4,
                  padding: "2px 6px",
                  fontFamily: "monospace",
                  fontSize: 10,
                  color: "var(--muted)",
                }}
              >
                {t}
              </span>
              {i < 3 ? ", " : ""}
            </span>
          ))}
          . Te respondo con links de fuente cuando se encuentren.
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </section>
  );
}
