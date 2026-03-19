import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 8,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.15)",
            position: "relative",
            background: "#ffffff",
          }}
        >
          <div style={{ position: "absolute", inset: 0, height: "50%", background: "#ffffff" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "50%", background: "#D52B1E" }} />
          <div style={{ position: "absolute", left: 0, top: 0, width: "40%", height: "50%", background: "#0039A6" }} />
          <div
            style={{
              position: "absolute",
              left: 5,
              top: 4.5,
              width: 6.5,
              height: 6.5,
              background: "#ffffff",
              clipPath:
                "polygon(50% 5%, 61% 35%, 95% 35%, 67% 53%, 77% 86%, 50% 67%, 23% 86%, 33% 53%, 5% 35%, 39% 35%)",
              opacity: 0.98,
            }}
          />
        </div>
      </div>
    ),
    { width: size.width, height: size.height },
  );
}

