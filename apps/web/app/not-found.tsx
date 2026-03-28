import Link from "next/link";
import { colors } from "./styles";

export default function NotFound() {
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
      <h2 style={{ color: colors.error, margin: 0 }}>404 — Page not found</h2>
      <p style={{ color: colors.slate400, maxWidth: "400px" }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        style={{
          backgroundColor: colors.green400,
          color: colors.slate100,
          border: "none",
          borderRadius: "6px",
          padding: "0.6rem 1.5rem",
          cursor: "pointer",
          fontSize: "1rem",
          textDecoration: "none",
        }}
      >
        Go home
      </Link>
    </div>
  );
}
