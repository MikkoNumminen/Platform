import type { Metadata } from "next";
import { Box } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import ThemeRegistry from "./components/ThemeRegistry";
import SessionProvider from "./components/SessionProvider";
import SnackbarProvider from "./components/SnackbarProvider";
import KeyboardShortcuts from "./components/KeyboardShortcuts";
import PendingBanner from "./components/PendingBanner";
import PendingGate from "./components/PendingGate";
import AliasGuard from "./components/AliasGuard";

const appName = process.env.NEXT_PUBLIC_APP_NAME || "Platform";

export const metadata: Metadata = {
  title: {
    default: appName,
    template: `%s | ${appName}`,
  },
  description: "Community platform for members",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://vuohiliitto.com",
  ),
  openGraph: {
    title: appName,
    description: "Community platform for members",
    siteName: appName,
    locale: "fi_FI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: appName,
    description: "Community platform for members",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fi">
      <body>
        <SessionProvider>
          <AppRouterCacheProvider>
            <ThemeRegistry>
              <SnackbarProvider>
                <AliasGuard />
                <PendingGate />
                <Box sx={{ pt: 2 }}>
                  <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
                    <PendingBanner />
                  </Box>
                  {children}
                </Box>
                <KeyboardShortcuts />
              </SnackbarProvider>
            </ThemeRegistry>
          </AppRouterCacheProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
