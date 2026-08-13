"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "../../doc.module.css";

type Summary = {
  id: string;
  kind: string;
  status: string;
  trackId: string | null;
  serviceId: string | null;
  downloadAvailable: boolean;
  downloadUrl: string | null;
  downloadExpiresAt: string | null;
  email: string | null;
};

export default function CheckoutSuccessClient() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setPending(false);
      setError("Missing session");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/checkout/session?session_id=${encodeURIComponent(sessionId)}`,
        );
        const data = (await res.json()) as {
          order?: Summary;
          error?: string;
        };
        if (!res.ok) throw new Error(data.error ?? "Lookup failed");
        if (!cancelled) setSummary(data.order ?? null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Lookup failed");
        }
      } finally {
        if (!cancelled) setPending(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <main className={styles.doc}>
      <header className={styles.bar}>
        <Link href="/" className="mono">
          GENUS//NS
        </Link>
        <span className="mono">CHECKOUT</span>
      </header>

      <h1>Payment received</h1>
      <p className={styles.lede}>
        Thank you. Orders are recorded for Rondanini Publishing Ltd t/a
        0dB_Labs. Service commissions are fulfilled manually.
      </p>

      {pending && <p className="mono">Confirming…</p>}
      {error && <p className={styles.footNote}>{error}</p>}

      {summary && (
        <ol className={styles.stages}>
          <li>
            <h2 className="mono">ORDER</h2>
            <p>
              {summary.id} · {summary.kind} · {summary.status}
              {summary.email ? ` · ${summary.email}` : ""}
            </p>
          </li>
          {summary.downloadUrl && (
            <li>
              <h2 className="mono">DOWNLOAD</h2>
              <p>
                <a href={summary.downloadUrl}>Download your file</a>
                {summary.downloadExpiresAt
                  ? ` · expires ${summary.downloadExpiresAt}`
                  : ""}
              </p>
            </li>
          )}
          {summary.kind === "service" && (
            <li>
              <h2 className="mono">NEXT</h2>
              <p>
                We will contact you to deliver the commission. No automatic
                download for service orders.
              </p>
            </li>
          )}
        </ol>
      )}

      <p className={styles.footNote}>
        <Link href="/services">Services</Link>
        {" · "}
        <Link href="/registry">Registry</Link>
      </p>
    </main>
  );
}
