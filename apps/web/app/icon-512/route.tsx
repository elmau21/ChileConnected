import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ChileConnected";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B1220",
          borderRadius: 96,
        }}
      >
        <div
          style={{
            width: 380,
            height: 380,
            borderRadius: 92,
            overflow: "hidden",
            boxShadow: "0 26px 90px rgba(0,0,0,0.40)",
            border: "4px solid rgba(255,255,255,0.10)",
            position: "relative",
            background: "#ffffff",
          }}
        >
          {/* Franja superior blanca */}
          <div style={{ position: "absolute", inset: 0, height: "50%", background: "#ffffff" }} />
          {/* Franja inferior roja */}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "50%", background: "#D52B1E" }} />
          {/* Cantón azul */}
          <div style={{ position: "absolute", left: 0, top: 0, width: "40%", height: "50%", background: "#0039A6" }} />
          {/* Estrella */}
          <div
            style={{
              position: "absolute",
              left: 86,
              top: 72,
              width: 82,
              height: 82,
              background: "#ffffff",
              clipPath:
                "polygon(50% 5%, 61% 35%, 95% 35%, 67% 53%, 77% 86%, 50% 67%, 23% 86%, 33% 53%, 5% 35%, 39% 35%)",
              opacity: 0.98,
            }}
          />
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
