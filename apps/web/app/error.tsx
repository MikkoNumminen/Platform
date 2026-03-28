"use client";

import { colors } from "./styles";

export default function Error({
  _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        gap: "1rem",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h2 style={{ color: colors.error, margin: 0 }}>Something went wrong</h2>
      <p style={{ color: colors.slate400, maxWidth: "400px" }}>
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        style={{
          backgroundColor: colors.green400,
          color: colors.slate100,
          border: "none",
          borderRadius: "6px",
          padding: "0.6rem 1.5rem",
          cursor: "pointer",
          fontSize: "1rem",
        }}
      >
        Try again
      </button>
    </div>
  );
}
