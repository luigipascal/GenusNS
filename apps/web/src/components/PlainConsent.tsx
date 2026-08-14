"use client";

import Script from "next/script";

declare global {
  interface Window {
    plainConsentConfig?: {
      privacyUrl?: string;
      googleAnalyticsId?: string;
      storageKey?: string;
      projectUrl?: string;
    };
  }
}

/** Public GA4 measurement ID. Loaded by PlainConsent only after Accept analytics. */
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-6PWGCLL17J";

/**
 * Same PlainConsent banner used on rondanini.com.
 * Do not inject gtag.js here — the banner script loads GA after opt-in.
 */
export function PlainConsent() {
  const gaId = GA_MEASUREMENT_ID;

  return (
    <>
      <Script id="plainconsent-config" strategy="afterInteractive">
        {`window.plainConsentConfig = {
  privacyUrl: "/privacy",
  storageKey: "plainconsent-genusns",
  googleAnalyticsId: ${JSON.stringify(gaId)},
  projectUrl: "https://plainconsent.berta.one"
};`}
      </Script>
      <Script
        src="https://plainconsent.berta.one/dist/plainconsent.js"
        strategy="afterInteractive"
      />
    </>
  );
}
