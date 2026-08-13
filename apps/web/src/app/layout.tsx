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
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          {children}
          <SiteFooter />
        </div>
        <PlainConsent />
      </body>
    </html>
  );
}
