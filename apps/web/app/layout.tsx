import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Platform",
  icons: [],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fi">
      <body>{children}</body>
    </html>
  );
}
