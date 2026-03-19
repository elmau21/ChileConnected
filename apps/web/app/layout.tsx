import "./globals.css";
import { Fraunces, Manrope } from "next/font/google";
import Script from "next/script";
import { TopNav } from "../components/TopNav";
import { TransitionWrapper } from "../components/TransitionWrapper";
import { InitialRouteLoader } from "../components/InitialRouteLoader";
import { ThemeToggle } from "../components/ThemeToggle";
import { PwaInstallPrompt } from "../components/PwaInstallPrompt";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata = {
  title: "ChileConnected",
  description: "Beneficios sociales en Chile: recomendaciones y chat con fuentes oficiales.",
  manifest: "/manifest.json",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#111827" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
  appleWebApp: { capable: true, title: "ChileConnected" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#111827" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Favicon explícito (cache-bust simple) */}
        <link rel="icon" href="/favicon.svg?v=3" type="image/svg+xml" />
        <link rel="alternate icon" href="/icon?v=3" type="image/png" />
        <link rel="shortcut icon" href="/favicon.svg?v=3" type="image/svg+xml" />
      </head>
      <body
        className={`${display.variable} ${body.variable} min-h-screen antialiased`}
        style={{ color: "var(--ink)" }}
      >
        <Script id="cc-theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('cc_theme');var d=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&d))document.documentElement.setAttribute('data-theme','dark');else document.documentElement.setAttribute('data-theme','light');}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`}
        </Script>
        <div className="noise-bg" />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 1300,
            margin: "0 auto",
            padding: "clamp(18px, 4vw, 28px) clamp(14px, 3.5vw, 24px) clamp(22px, 5vw, 32px)",
          }}
        >
          {/* ── HEADER ── */}
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "clamp(18px, 4vw, 28px)",
            }}
          >
            {/* Logo + wordmark */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: "#111827",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  overflow: "hidden",
                }}
              >
                {/* Bandera de Chile en SVG para evitar fallback tipo texto */}
                <svg
                  viewBox="0 0 30 20"
                  width="100%"
                  height="100%"
                  role="img"
                  aria-label="Bandera de Chile"
                  preserveAspectRatio="none"
                >
                  {/* Contorno del paño */}
                  <rect
                    x="0.8"
                    y="0.8"
                    width="28.4"
                    height="18.4"
                    rx="3.2"
                    fill="transparent"
                    stroke="#E5E7EB"
                    strokeWidth="1.2"
                  />

                  {/* Cantón azul */}
                  <rect x="0" y="0" width="12" height="10" fill="#0039A6" />

                  {/* Franjas blanco/rojo */}
                  <rect x="0" y="0" width="30" height="10" fill="#FFFFFF" />
                  <rect x="0" y="10" width="30" height="10" fill="#D52B1E" />

                  {/* Estrella centrada en el cantón (aprox.) */}
                  <polygon
                    points="6,3.3 6.65,4.2 7.75,4.2 6.95,4.95 7.25,6 6,5.4 4.75,6 5.05,4.95 4.25,4.2 5.35,4.2"
                    fill="#FFFFFF"
                    opacity="0.98"
                  />

                  {/* Refuerza la prioridad del cantón sobre la franja blanca */}
                  <rect x="0" y="0" width="12" height="10" fill="#0039A6" opacity="1" />
                </svg>
              </div>
              <div>
                <div
                  className="font-display"
                  style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)" }}
                >
                  ChileConnected
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1, letterSpacing: "0.01em" }}>
                  Beneficios · Recomendaciones · Chat RAG
                </div>
              </div>
            </div>
            <ThemeToggle />
          </header>

          {/* ── NAV ── */}
          <TopNav />

          {/* ── MAIN ── */}
          <InitialRouteLoader>
            <TransitionWrapper>{children}</TransitionWrapper>
          </InitialRouteLoader>

          <PwaInstallPrompt />

          {/* ── FOOTER ── */}
          <footer
            role="contentinfo"
            aria-label="Pie de página"
            style={{
              marginTop: 48,
              paddingTop: 20,
              borderTop: "1px solid #E5E7EB",
              fontSize: 12,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)" }}>
              <span>Respuestas referenciales.</span>
              <span style={{ color: "#D1D5DB" }}>·</span>
              <span>Confirma en fuentes oficiales.</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
<a href="/privacidad" className="footer-link" style={{ color: "var(--muted)", textDecoration: "none", transition: "color 0.2s" }}>
              Privacidad
              </a>
              <a href="/faq" className="footer-link" style={{ color: "var(--muted)", textDecoration: "none", transition: "color 0.2s" }}>
                FAQ
              </a>
              <span style={{ color: "var(--border)" }}>·</span>
              <a href="https://www.ventanillaunicasocial.gob.cl/" target="_blank" rel="noreferrer noopener" className="footer-link" style={{ color: "var(--muted)", textDecoration: "none", transition: "color 0.2s" }} aria-label="Ventanilla Única Social (abre en nueva pestaña)">
                Ventanilla Única Social ↗
              </a>
              <a href="https://www.chileatiende.gob.cl/" target="_blank" rel="noreferrer noopener" className="footer-link" style={{ color: "var(--muted)", textDecoration: "none", transition: "color 0.2s" }} aria-label="ChileAtiende (abre en nueva pestaña)">
                ChileAtiende ↗
              </a>
              <a href="https://www.gob.cl/ministerios/ministerio-de-desarrollo-social-y-familia/" target="_blank" rel="noreferrer noopener" className="footer-link" style={{ color: "var(--muted)", textDecoration: "none", transition: "color 0.2s" }} aria-label="MIDESOF (abre en nueva pestaña)">
                MIDESOF ↗
              </a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
