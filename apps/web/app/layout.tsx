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

export const metadata: Metadata = {
  title: "Platform",
  icons: [],
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
