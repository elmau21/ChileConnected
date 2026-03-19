"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bot, LayoutDashboard, Sparkles } from "lucide-react";

function NavItem({ href, label, desc }: { href: string; label: string; desc: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  const Icon = href === "/chat" ? Bot : href === "/recomendaciones" ? Sparkles : LayoutDashboard;

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        borderRadius: 14,
        padding: "12px 16px",
        textDecoration: "none",
        transition: "all 0.2s ease",
        position: "relative",
        border: active
          ? "1px solid var(--border)"
          : "1px solid transparent",
        background: active
          ? "var(--card)"
          : "transparent",
        boxShadow: active
          ? "var(--shadow-sm)"
          : "none",
      }}
      className={active ? "" : "nav-item-hover"}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, position: "relative" }}>
        {/* Icon box */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            background: active
              ? "var(--card-hover)"
              : "transparent",
            color: active ? "var(--ink)" : "var(--muted)",
          }}
        >
          <Icon size={18} />
        </div>

        {/* Labels */}
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: active ? "var(--ink)" : "var(--muted)",
              lineHeight: 1.3,
            }}
          >
            {label}
          </div>
          <div style={{ fontSize: 11, color: active ? "var(--muted)" : "var(--muted)", marginTop: 2, opacity: active ? 1 : 0.8 }}>
            {desc}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 13, color: active ? "var(--muted)" : "transparent", flexShrink: 0, transition: "color 0.2s" }} className="nav-arrow">
        →
      </div>
    </Link>
  );
}

export function TopNav() {
  const [chatDesc] = useState("¡Tu asistente confiable!");

  return (
    <nav>
      <div
        style={{
          borderRadius: 18,
          padding: 8,
        background: "var(--card-hover)",
        border: "1px solid var(--border)",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)",
        }}
      >
        <div className="topnav-grid">
          <NavItem href="/" label="Inicio" desc="Resumen, accesos y estado" />
          <NavItem href="/recomendaciones" label="Recomendaciones" desc="Perfil → elegibilidad" />
          <NavItem href="/chat" label="Conecta" desc={chatDesc} />
        </div>
      </div>

      <style>{`
        .nav-item-hover:hover {
          background: var(--card-hover) !important;
          border-color: var(--border) !important;
        }
        .nav-item-hover:hover .nav-arrow {
          color: var(--muted) !important;
        }
      `}</style>
    </nav>
  );
}
