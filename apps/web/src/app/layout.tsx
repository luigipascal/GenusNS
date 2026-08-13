import type { Metadata } from "next";
import { Archivo, Source_Serif_4 } from "next/font/google";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@genusns/ui-tokens/tokens.css";
import { PlainConsent } from "@/components/PlainConsent";
import { SiteFooter } from "@/components/SiteFooter";
import { LEGAL } from "@/lib/legal";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
  weight: ["500", "600", "700"],
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "GENUS//NS",
    template: "%s · GENUS//NS",
  },
  description: `Music for genres that do not exist yet. A Neural Syntax experiment in computational musical taxonomy. ${LEGAL.imprint}.`,
  other: {
    "publisher": LEGAL.imprint,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${sourceSerif.variable}`}>
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
