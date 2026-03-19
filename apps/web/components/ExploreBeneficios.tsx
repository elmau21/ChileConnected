"use client";

import { useEffect, useRef, useState } from "react";
import { buscarBeneficios } from "../lib/api";
import { getFriendlyErrorMessage } from "../lib/errors";
import { ExternalLink, Search, SearchX, RefreshCw } from "lucide-react";

type Item = {
  _id: string;
  nombre: string;
  descripcion: string;
  fuente_url: string;
  fuente: "midesof" | "chileatiende";
  estado: "abierto" | "cerrado";
  monto?: number;
};

function EmptyState({ searched }: { searched: boolean }) {
  return (
    <div
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "32px 16px", gap: 12, textAlign: "center",
      }}
    >
      <div
        style={{
          width: 52, height: 52, borderRadius: 14,
          background: "var(--card-hover)",
          border: "1px solid var(--border)",
          display: "grid", placeItems: "center",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {searched
          ? <SearchX size={22} style={{ color: "var(--muted)" }} />
          : <Search size={22} style={{ color: "var(--muted)" }} />
        }
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 4 }}>
          {searched ? "Sin resultados" : "Busca un beneficio"}
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.6, maxWidth: 220 }}>
          {searched
            ? "Intenta con otras palabras clave, ej: \"adulto mayor\", \"subsidio\", \"embarazo\"."
            : "Escribe una palabra clave y presiona Buscar o Enter."
          }
        </div>
      </div>
    </div>
  );
}

export function ExploreBeneficios() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // En celular el dropdown de autocompletado tiende a “buguearse” por stacking/overflow.
  // Preferimos ocultarlo para que el UI se vea estable.
  const [isMobile, setIsMobile] = useState(false);

  const [suggestions, setSuggestions] = useState<Item[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    try {
      const mq = window.matchMedia("(max-width: 640px)");
      const apply = () => setIsMobile(!!mq.matches);
      apply();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      mq.addEventListener?.("change", apply);
      return () => mq.removeEventListener?.("change", apply);
    } catch {
      setIsMobile(false);
      return;
    }
  }, []);

  async function run(input?: string) {
    const query = (input ?? q).trim();
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const res = await buscarBeneficios(query || undefined, { limit: 15 });
      setItems(res.items as Item[]);
    } catch (e: any) {
      setError(getFriendlyErrorMessage(e, "buscar"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const query = q.trim();

    setSuggestionsError(null);
    setActiveSuggestionIndex(-1);

    // Si es móvil, ocultamos el dropdown y evitamos llamadas extra.
    if (isMobile) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSuggestionsLoading(false);
      return;
    }

    // Si está vacío o muy corto, no mostramos dropdown.
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSuggestionsLoading(false);
      return;
    }

    const myId = ++requestIdRef.current;
    setSuggestionsLoading(true);

    const t = setTimeout(async () => {
      try {
        const res = await buscarBeneficios(query, { limit: 8 });
        if (myId !== requestIdRef.current) return;
        setSuggestions(res.items as Item[]);
        setShowSuggestions(true);
        setActiveSuggestionIndex((prev) => (prev === -1 ? 0 : prev));
      } catch (e: any) {
        if (myId !== requestIdRef.current) return;
        setSuggestionsError(getFriendlyErrorMessage(e, "buscar"));
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        if (myId !== requestIdRef.current) return;
        setSuggestionsLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(t);
    };
  }, [q]);

  useEffect(() => {
    function onDocMouseDown(ev: MouseEvent) {
      const el = wrapperRef.current;
      if (!el) return;
      if (ev.target instanceof Node && el.contains(ev.target)) return;
      setShowSuggestions(false);
    }

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const quickIdeas = [
    "adulto mayor",
    "subsidio",
    "embarazo",
    "discapacidad",
    "vivienda",
    "cesantía",
  ];

  function clearSearch() {
    setQ("");
    setItems([]);
    setError(null);
    setHasSearched(false);
    setShowSuggestions(false);
    setSuggestions([]);
    setSuggestionsError(null);
    setSuggestionsLoading(false);
    setActiveSuggestionIndex(-1);
  }

  return (
    <section
      className="glass-card"
      style={{
        padding: "20px",
        display: "flex", flexDirection: "column", gap: 14,
      }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.01em" }}>
          Explorar beneficios
        </div>
        <div style={{ marginTop: 3, fontSize: 12, color: "var(--muted)" }}>
          Búsqueda por texto — nombre, descripción o requisitos
        </div>
      </div>

      {/* Search bar */}
      <div style={{ display: "flex", gap: 8 }}>
        <div ref={wrapperRef} style={{ position: "relative", flex: 1 }}>
          <div style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            color: "var(--muted)", display: "flex", pointerEvents: "none",
          }}>
            <Search size={14} />
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setShowSuggestions(false);
                setActiveSuggestionIndex(-1);
                return;
              }

              if (showSuggestions && suggestions.length > 0) {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveSuggestionIndex((i) => Math.min(i + 1, suggestions.length - 1));
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveSuggestionIndex((i) => Math.max(i - 1, 0));
                  return;
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  const idx = activeSuggestionIndex >= 0 ? activeSuggestionIndex : 0;
                  const chosen = suggestions[idx];
                  if (chosen) {
                    setShowSuggestions(false);
                    setActiveSuggestionIndex(-1);
                    setQ(chosen.nombre);
                    void run(chosen.nombre);
                  }
                  return;
                }
              }

              if (e.key === "Enter") {
                setShowSuggestions(false);
                setActiveSuggestionIndex(-1);
                void run();
              }
            }}
            placeholder="adulto mayor, subsidio, embarazo…"
            className="input-glass"
            style={{ paddingLeft: 36, paddingRight: 14, paddingTop: 11, paddingBottom: 11 }}
          />

          {/* Autocomplete dropdown */}
          {showSuggestions && !isMobile && (
            <div
              className="result-card"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "calc(100% + 8px)",
                zIndex: 9999,
                padding: 8,
                borderRadius: 16,
                background: "var(--card)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-card)",
                maxHeight: 320,
                overflowY: "auto",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px 10px 6px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
                  Sugerencias
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>
                  {suggestionsLoading ? "Buscando..." : `${suggestions.length} opciones`}
                </div>
              </div>

              {suggestionsError ? (
                <div style={{ fontSize: 12, color: "#f87171", padding: 8 }}>
                  {suggestionsError}
                </div>
              ) : suggestions.length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--muted)", padding: 8 }}>
                  No hay sugerencias para “{q.trim()}”
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {suggestions.map((s, idx) => (
                    <button
                      key={s._id}
                      type="button"
                      onClick={() => {
                        setShowSuggestions(false);
                        setQ(s.nombre);
                        setActiveSuggestionIndex(-1);
                        void run(s.nombre);
                      }}
                      className="autocomplete-row"
                      style={{
                        background: activeSuggestionIndex === idx ? "var(--card-hover)" : "transparent",
                        border: activeSuggestionIndex === idx ? "1px solid var(--border)" : "1px solid transparent",
                        borderRadius: 12,
                        padding: "10px 10px",
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        minWidth: 0,
                      }}
                      onMouseEnter={() => setActiveSuggestionIndex(idx)}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {s.nombre}
                          </div>
                          <div style={{ marginTop: 4, fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {s.descripcion}
                          </div>
                        </div>
                        <span className="badge badge-muted" style={{ flexShrink: 0 }}>
                          {s.fuente}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => void run()}
          disabled={loading}
          className="btn-gradient"
          style={{ padding: "11px 18px", fontSize: 13, display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
        >
          <Search size={13} />
          Buscar
        </button>

        <button
          type="button"
          onClick={clearSearch}
          disabled={loading && !q.trim()}
          className="btn-gradient"
          style={{
            padding: "11px 14px",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
            background: "var(--card-hover)",
            color: "var(--muted)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <SearchX size={13} />
          Limpiar
        </button>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <p style={{ fontSize: 12, color: "#f87171", margin: 0, flex: "1 1 200px" }}>{error}</p>
          <button
            type="button"
            onClick={() => { setError(null); void run(); }}
            disabled={loading}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px", fontSize: 12, fontWeight: 600,
              background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8,
              color: "var(--ink)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            }}
          >
            <RefreshCw size={14} />
            Reintentar
          </button>
        </div>
      )}

      {/* Quick recommendations when input is empty */}
      {!q.trim() && (
        <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 12, color: "var(--muted)", alignSelf: "center" }}>
            Recomendaciones rápidas:
          </div>
          {quickIdeas.map((idea) => (
            <button
              key={idea}
              type="button"
              onClick={() => {
                setQ(idea);
                void run(idea);
              }}
              className="badge badge-muted"
              style={{
                cursor: "pointer",
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: "var(--card-hover)",
                padding: "7px 10px",
                fontSize: 12,
                color: "var(--muted)",
              }}
            >
              {idea}
            </button>
          ))}
        </div>
      )}

      {/* Results / Empty state */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer"
                style={{ height: 76, borderRadius: 12, border: "1px solid var(--border)" }} />
            ))}
          </>
        ) : items.length > 0 ? (
          <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.slice(0, 15).map((it) => (
              <a
                key={it._id} href={it.fuente_url} target="_blank" rel="noreferrer"
                className="result-card" style={{ textDecoration: "none", display: "block" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {it.nombre}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 11, color: "var(--muted)", lineHeight: 1.5,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {it.descripcion}
                    </div>
                    <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 5 }}>
                      <span className="badge badge-muted">{it.fuente}</span>
                      <span className={`badge ${it.estado === "abierto" ? "badge-green" : "badge-red"}`}>{it.estado}</span>
                      {it.monto != null && (
                        <span className="badge badge-blue">${it.monto.toLocaleString("es-CL")}</span>
                      )}
                    </div>
                  </div>
                  <ExternalLink size={13} style={{ color: "var(--muted)", flexShrink: 0, marginTop: 2 }} />
                </div>
              </a>
            ))}
          </div>
        ) : (
          <EmptyState searched={hasSearched} />
        )}
      </div>
    </section>
  );
}
