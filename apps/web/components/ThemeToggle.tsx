"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "cc_theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) as "light" | "dark" | null;
    const dark = stored === "dark" || (!stored && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const next = dark ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Usar tema claro" : "Usar tema oscuro"}
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--card)",
        color: "var(--ink)",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        transition: "background 0.2s, border-color 0.2s",
      }}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
