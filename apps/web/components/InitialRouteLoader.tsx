"use client";

import { useEffect, useMemo, useState } from "react";

export function InitialRouteLoader({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  const styleId = useMemo(() => `init-loader-${Math.random().toString(16).slice(2)}`, []);

  useEffect(() => {
    let cancelled = false;

    const MAX_MS = 3500;
    const startedAt = Date.now();

    const fontsReady = (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fonts = (document as any)?.fonts;
        if (fonts?.ready) await fonts.ready;
      } catch {
        // ignore
      }
    })();

    const loadReady = new Promise<void>((resolve) => {
      if (document.readyState === "complete") {
        resolve();
        return;
      }
      const onLoad = () => {
        window.removeEventListener("load", onLoad);
        resolve();
      };
      window.addEventListener("load", onLoad);
    });

    const timeout = window.setTimeout(() => {
      if (cancelled) return;
      setIsLoading(false);
    }, MAX_MS);

    void Promise.all([fontsReady, loadReady])
      .then(() => {
        if (cancelled) return;
        const elapsed = Date.now() - startedAt;
        if (elapsed >= MAX_MS) return;
        window.setTimeout(() => setIsLoading(false), Math.max(0, MAX_MS - elapsed));
      })
      .finally(() => {
        window.clearTimeout(timeout);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <>
      {/* CSS local para evitar pelear con animaciones globales */}
      <style>{`
        @keyframes initSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes initPulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        .init-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(250,250,250,0.72); backdrop-filter: blur(10px); }
        .init-card { width: min(520px, calc(100% - 32px)); margin: 14vh auto 0 auto; padding: 26px 22px; border-radius: 22px; border: 1px solid #E5E7EB; background: rgba(255,255,255,0.88); box-shadow: 0 30px 80px rgba(0,0,0,0.10); }
        .init-row { display: flex; align-items: center; justify-content: center; gap: 14px; }
        .init-spinner { width: 44px; height: 44px; border-radius: 999px; border: 2px solid rgba(17,24,39,0.10); border-top-color: #111827; animation: initSpin 1s linear infinite; }
        .init-text { display: flex; flex-direction: column; align-items: center; gap: 6px; margin-top: 14px; }
        .init-title { font-weight: 800; color: #111827; letter-spacing: -0.02em; }
        .init-sub { font-size: 12px; color: #6B7280; text-align: center; line-height: 1.5; max-width: 320px; }
        .init-dots { display: inline-flex; gap: 6px; align-items: center; }
        .init-dot { width: 6px; height: 6px; border-radius: 999px; background: #2563EB; animation: initPulse 1s ease-in-out infinite; }
        .init-dot:nth-child(2) { animation-delay: 0.15s; }
        .init-dot:nth-child(3) { animation-delay: 0.3s; }

        @media (prefers-reduced-motion: reduce) {
          .init-spinner, .init-dot { animation: none !important; }
        }
      `}</style>

      {isLoading && (
        <div className="init-overlay" role="status" aria-live="polite">
          <div className="init-card">
            <div className="init-row">
              <div className="init-spinner" aria-hidden="true" />
            </div>
            <div className="init-text">
              <div className="init-title">Cargando ChileConnected…</div>
              <div className="init-sub">
                Preparando recomendaciones y respuestas. Esto debería tardar menos de 3.5 segundos.
              </div>
              <div className="init-dots" aria-hidden="true" style={{ marginTop: 6 }}>
                <span className="init-dot" />
                <span className="init-dot" />
                <span className="init-dot" />
              </div>
            </div>
          </div>
        </div>
      )}

      {children}
    </>
  );
}

