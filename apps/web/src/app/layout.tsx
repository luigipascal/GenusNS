import type { Metadata } from "next";
import "@fontsource/archivo/500.css";
import "@fontsource/archivo/600.css";
import "@fontsource/archivo/700.css";
import "@fontsource/source-serif-4/400.css";
import "@fontsource/source-serif-4/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@genusns/ui-tokens/tokens.css";
import { PlainConsent } from "@/components/PlainConsent";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { LEGAL } from "@/lib/legal";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GENUS//NS",
    template: "%s · GENUS//NS",
  },
  description: `Music for genres that do not exist yet. A Neural Syntax experiment in computational musical taxonomy. ${LEGAL.imprint}.`,
  other: {
    publisher: LEGAL.imprint,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <SiteHeader />
          {children}
          <SiteFooter />
        </div>
        <PlainConsent />
      </body>
    </html>
  );
}

