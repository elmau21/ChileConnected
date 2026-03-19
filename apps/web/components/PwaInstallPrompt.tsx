"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

const DISMISS_KEY = "cc_pwa_dismissed";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    try {
      const standalone =
        // iOS
        (navigator as any).standalone === true ||
        // Chrome
        window.matchMedia?.("(display-mode: standalone)")?.matches === true;
      setIsStandalone(standalone);
    } catch {
      setIsStandalone(false);
    }

    try {
      const stored = localStorage.getItem(DISMISS_KEY);
      if (stored === "true") {
        setDismissed(true);
        return;
      }
    } catch {
      // ignore
    }

    const handler = (e: Event) => {
      // Si ya está instalado como app, no mostramos el prompt.
      if (isStandalone) return;
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
      setDismissed(false);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setShow(false);
      try {
        localStorage.setItem(DISMISS_KEY, "true");
      } catch {}
    });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
      setDeferredPrompt(null);
    }
    try {
      localStorage.setItem(DISMISS_KEY, "true");
    } catch {}
    setDismissed(true);
  }

  function handleDismiss() {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, "true");
    } catch {}
    setDismissed(true);
  }

  if (!show || dismissed || isStandalone) return null;

  return (
    <div
      role="region"
      aria-label="Instalar aplicación"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        maxWidth: 360,
        width: "calc(100% - 32px)",
        padding: "14px 18px",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        boxShadow: "var(--shadow-card)",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: "var(--ink)",
          color: "var(--card)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <Download size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
          Instalar ChileConnected
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
          Úsalo como app en tu celular o escritorio
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button
          type="button"
          onClick={handleInstall}
          style={{
            padding: "8px 14px",
            fontSize: 12,
            fontWeight: 600,
            background: "var(--ink)",
            color: "var(--card)",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Instalar
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Cerrar"
          style={{
            padding: 6,
            background: "transparent",
            border: "none",
            borderRadius: 8,
            color: "var(--muted)",
            cursor: "pointer",
          }}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
