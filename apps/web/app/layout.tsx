import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import ThemeRegistry from "./components/ThemeRegistry";
import SessionProvider from "./components/SessionProvider";
import SnackbarProvider from "./components/SnackbarProvider";
import KeyboardShortcuts from "./components/KeyboardShortcuts";

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
                {children}
                <KeyboardShortcuts />
              </SnackbarProvider>
            </ThemeRegistry>
          </AppRouterCacheProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
