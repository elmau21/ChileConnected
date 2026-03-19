"use client";

import { type ReactNode, useId } from "react";

export function Field({
  label,
  icon,
  children,
  hint,
  value,
}: {
  label: string;
  icon?: ReactNode;
  children: (args: { id: string; "aria-describedby"?: string }) => ReactNode;
  hint?: string;
  value?: string | number | null | undefined;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const isFilled = value !== undefined && value !== null && String(value).trim() !== "";

  return (
    <div style={{ position: "relative" }}>
      <div
        className={`field-wrap ${isFilled ? "is-filled" : ""}`}
        style={{
          position: "relative",
          borderRadius: 14,
          background: "var(--card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
          overflow: "hidden",
        }}
      >
        {/* Icon */}
        {icon && (
          <div
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--muted)",
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              zIndex: 2,
              transition: "color 0.2s ease",
            }}
            className="field-icon"
          >
            {icon}
          </div>
        )}

        {/* Floating label */}
        <label
          htmlFor={id}
          className="field-label"
          style={{
            position: "absolute",
            left: icon ? 40 : 16,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 14,
            fontWeight: 500,
            color: "var(--muted)",
            pointerEvents: "none",
            zIndex: 1,
            transformOrigin: "left center",
            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </label>

        {/* Input/select */}
        {hintId ? children({ id, "aria-describedby": hintId }) : children({ id })}
      </div>

      {hint && (
        <div id={hintId} style={{ marginTop: 6, fontSize: 11, color: "var(--muted)" }}>
          {hint}
        </div>
      )}

      <style>{`
        /* Focus glow */
        .field-wrap:focus-within {
          border-color: #10B981 !important;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.1), var(--shadow-sm) !important;
          background: var(--card) !important;
        }
        .field-wrap:focus-within .field-icon {
          color: #10B981 !important;
        }

        /* Float label UP on focus or when input has value */
        .field-wrap:focus-within .field-label,
        .field-wrap.is-filled .field-label {
          top: 12px !important;
          transform: translateY(0) scale(0.7) !important;
          color: #10B981 !important;
          letter-spacing: 0.05em !important;
          text-transform: uppercase !important;
          font-weight: 700 !important;
        }
        .field-wrap.is-filled:not(:focus-within) .field-label {
          color: var(--muted) !important;
        }

        /* Input styling inside field */
        .field-wrap input,
        .field-wrap select {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          font-size: 14px;
          color: var(--ink);
          padding-top: 24px;
          padding-bottom: 8px;
          padding-left: ${icon ? "40px" : "16px"};
          padding-right: 16px;
          transition: padding 0.18s ease;
          font-family: inherit;
        }
        .field-wrap select {
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
        }
        .field-wrap select option {
          background-color: var(--card);
          color: var(--ink);
        }
        .field-wrap input::placeholder {
          color: transparent;
        }
        .field-wrap input:focus::placeholder {
          color: var(--muted);
          transition: color 0.15s ease 0.12s;
        }
      `}</style>
    </div>
  );
}
