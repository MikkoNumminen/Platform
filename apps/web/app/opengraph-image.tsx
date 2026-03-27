import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Community Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Platform";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 64 64"
          width="160"
          height="160"
        >
          <g
            transform="translate(32,34)"
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M-8,-18 C-14,-28 -18,-22 -16,-16" strokeWidth="2.2" />
            <path d="M8,-18 C14,-28 18,-22 16,-16" strokeWidth="2.2" />
            <ellipse cx="0" cy="-10" rx="10" ry="12" />
            <path d="M-10,-12 L-16,-8 L-10,-6" />
            <path d="M10,-12 L16,-8 L10,-6" />
            <circle cx="-4" cy="-12" r="1.5" fill="#e0e0e0" />
            <circle cx="4" cy="-12" r="1.5" fill="#e0e0e0" />
            <ellipse cx="0" cy="-4" rx="4" ry="3" fill="none" />
            <circle cx="-1.5" cy="-4" r="0.8" fill="#e0e0e0" />
            <circle cx="1.5" cy="-4" r="0.8" fill="#e0e0e0" />
            <path d="M0,2 C0,8 -2,12 0,14" />
          </g>
        </svg>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#ffffff",
            marginTop: 24,
            letterSpacing: "-0.02em",
          }}
        >
          {appName}
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#94a3b8",
            marginTop: 12,
          }}
        >
          Community Platform
        </div>
      </div>
    ),
    { ...size },
  );
}
