"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "../doc.module.css";

const SERVICES = [
  {
    id: "genome-commission",
    name: "Genome commission",
    blurb: "A custom Genre Genesis pack and GENUS//NS species record for your project.",
    priceLabel: "from £450",
    priceGbp: 45000,
  },
  {
    id: "refine-master",
    name: "Refine & master consult",
    blurb: "Performance-layer analysis and named DSP guidance on a track you supply.",
    priceLabel: "from £180",
    priceGbp: 18000,
  },
  {
    id: "release-kit",
    name: "Release kit",
    blurb: "Cover, artist mark, provenance pack and Ditto-ready folder for one species.",
    priceLabel: "from £90",
    priceGbp: 9000,
  },
] as const;

export default function ServicesPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkout(serviceId: string) {
    setBusy(serviceId);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "service", serviceId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Checkout unavailable");
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setBusy(null);
    }
  }

  return (
    <main className={styles.doc}>
      <header className={styles.bar}>
        <Link href="/" className="mono">
          GENUS//NS
        </Link>
        <span className="mono">SERVICES</span>
      </header>

      <h1>Services</h1>
      <p className={styles.lede}>
        Commission work around the GENUS//NS experiment. Payments via Stripe.
        Delivery is coordinated by Neural Syntax / Rondanini Publishing Ltd t/a
        0dB_Labs.
      </p>

      <ul className={styles.stages}>
        {SERVICES.map((s) => (
          <li key={s.id}>
            <h2 className="mono">{s.name.toUpperCase()}</h2>
            <p>{s.blurb}</p>
            <p className="mono" style={{ marginTop: "0.75rem", opacity: 0.7 }}>
              {s.priceLabel}
            </p>
            <button
              type="button"
              className="mono"
              style={{
                marginTop: "0.75rem",
                borderBottom: "1px solid var(--gns-line-strong)",
                letterSpacing: "0.16em",
                fontSize: "0.7rem",
                paddingBottom: "0.25rem",
              }}
              disabled={busy === s.id}
              onClick={() => checkout(s.id)}
            >
              {busy === s.id ? "REDIRECTING…" : "PAY WITH STRIPE"}
            </button>
          </li>
        ))}
      </ul>

      {error && (
        <p className={styles.footNote} style={{ color: "#c45c5c" }}>
          {error}. Set STRIPE_SECRET_KEY on Coolify to enable checkout.
        </p>
      )}
    </main>
  );
}
