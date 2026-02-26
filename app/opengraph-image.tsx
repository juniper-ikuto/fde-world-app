import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "FDE World — Every FDE, SE and Solutions role. One place.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#09090B",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Glow blob */}
        <div style={{ position: "absolute", top: -100, right: -100, width: 600, height: 600, background: "radial-gradient(circle, rgba(79,70,229,0.25) 0%, transparent 70%)", borderRadius: "50%" }} />

        {/* Accent bar */}
        <div style={{ width: 60, height: 4, background: "#4F46E5", borderRadius: 4, marginBottom: 40 }} />

        {/* Wordmark */}
        <div style={{ color: "#FAFAFA", fontSize: 28, fontWeight: 600, marginBottom: 32, letterSpacing: "-0.5px" }}>
          FDE World
        </div>

        {/* Headline */}
        <div style={{ color: "#FAFAFA", fontSize: 56, fontWeight: 700, letterSpacing: "-1.5px", lineHeight: 1.1, marginBottom: 24 }}>
          Every FDE, SE and<br />Solutions role. One place.
        </div>

        {/* Sub */}
        <div style={{ color: "#71717A", fontSize: 24 }}>
          The community for client-facing technical talent · Free to join
        </div>

        {/* Curated by */}
        <div style={{ position: "absolute", bottom: 60, left: 80, color: "#52525B", fontSize: 16 }}>
          Curated by Ikuto Group
        </div>
        <div style={{ position: "absolute", bottom: 60, right: 80, color: "#52525B", fontSize: 18 }}>
          fdeworld.com
        </div>
      </div>
    ),
    { ...size }
  );
}
