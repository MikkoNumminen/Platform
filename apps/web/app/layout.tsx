import type { Metadata } from "next";
import { Cinzel } from "next/font/google";
import { Box } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import ThemeRegistry from "./components/ThemeRegistry";
import SessionProvider from "./components/SessionProvider";
import SnackbarProvider from "./components/SnackbarProvider";
import KeyboardShortcuts from "./components/KeyboardShortcuts";
import PendingBanner from "./components/PendingBanner";
import PendingGate from "./components/PendingGate";
import AliasGuard from "./components/AliasGuard";
import PromotionGate from "./components/PromotionGate";
import XpToastProvider from "./components/XpToastProvider";
import TutorialProvider from "./components/TutorialProvider";
import TutorialSpotlight from "./components/TutorialSpotlight";
import TutorialCelebration from "./components/TutorialCelebration";
import BottomPanelStack from "./components/BottomPanelStack";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-cinzel",
});

const appName = process.env.NEXT_PUBLIC_APP_NAME || "Platform";

export const metadata: Metadata = {
  title: {
    default: appName,
    template: `%s | ${appName}`,
  },
  description: "Community platform for members",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://vuohiliitto.com"),
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={cinzel.variable}>
      <body>
        <Box
          component="a"
          href="#main-content"
          sx={{
            position: "absolute",
            left: "-9999px",
            top: "auto",
            width: "1px",
            height: "1px",
            overflow: "hidden",
            "&:focus": {
              position: "static",
              width: "auto",
              height: "auto",
              p: 1,
              bgcolor: "background.paper",
              zIndex: 9999,
            },
          }}
        >
          Skip to content
        </Box>
        <SessionProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <AppRouterCacheProvider>
              <ThemeRegistry>
                <SnackbarProvider>
                  <XpToastProvider>
                    <TutorialProvider>
                      <AliasGuard />
                      <PendingGate />
                      <PromotionGate />
                      <Box id="main-content" component="main" sx={{ pt: 2 }}>
                        <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
                          <PendingBanner />
                        </Box>
                        {children}
                      </Box>
                      <KeyboardShortcuts />
                      <TutorialSpotlight />
                      <TutorialCelebration />
                      <BottomPanelStack />
                    </TutorialProvider>
                  </XpToastProvider>
                </SnackbarProvider>
              </ThemeRegistry>
            </AppRouterCacheProvider>
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
