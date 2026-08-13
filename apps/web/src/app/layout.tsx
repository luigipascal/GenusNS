import type { Metadata } from "next";
import "@fontsource/syne/500.css";
import "@fontsource/syne/600.css";
import "@fontsource/syne/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@genusns/ui-tokens/tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "GENUS//NS",
  description:
    "Music for genres that do not exist yet. A Neural Syntax experiment in computational musical taxonomy, published by 0dB_Labs.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
