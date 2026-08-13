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

/**
 * Same PlainConsent banner used on rondanini.com.
 * Essential cookies only until the visitor opts into analytics.
 */
export function PlainConsent() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

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
