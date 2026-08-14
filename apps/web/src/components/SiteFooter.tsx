"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { LEGAL, companyRegistrationLine } from "@/lib/legal";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  const year = new Date().getUTCFullYear();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "ok" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  async function onSubscribe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("pending");
    setMessage(null);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        hint?: string;
        doubleOptIn?: boolean;
      };
      if (!res.ok || !data.ok) {
        const detail = [data.error, data.hint].filter(Boolean).join(" — ");
        throw new Error(detail || "Subscribe failed");
      }
      setStatus("ok");
      setMessage(
        data.doubleOptIn
          ? "Check your email to confirm."
          : "Subscribed. Thank you.",
      );
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Subscribe failed");
    }
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.imprint}>
        <p className={styles.brand}>
          <span className="mono">{LEGAL.artist}</span>
          <span aria-hidden="true"> · </span>
          <span>{LEGAL.imprint}</span>
        </p>
        <p className={styles.roles}>
          Artist {LEGAL.artist} · Operator {LEGAL.operator} · Label{" "}
          {LEGAL.label}
        </p>
      </div>

      <form className={styles.newsletter} onSubmit={onSubscribe}>
        <label className={styles.newsletterLabel} htmlFor="footer-newsletter-email">
          Newsletter
        </label>
        <div className={styles.newsletterRow}>
          <input
            id="footer-newsletter-email"
            className={styles.newsletterInput}
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(ev) => {
              setEmail(ev.target.value);
              if (status !== "idle" && status !== "pending") {
                setStatus("idle");
                setMessage(null);
              }
            }}
            disabled={status === "pending"}
          />
          <button
            type="submit"
            className={styles.newsletterSubmit}
            disabled={status === "pending"}
          >
            {status === "pending" ? "Sending…" : "Subscribe"}
          </button>
        </div>
        {message && (
          <p
            className={styles.newsletterStatus}
            role={status === "error" ? "alert" : "status"}
            data-state={status}
          >
            {message}
          </p>
        )}
      </form>

      <nav className={styles.legal} aria-label="Legal">
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms of Use</Link>
        <a href="#cookie-settings" data-plainconsent-settings>
          Cookie settings
        </a>
        <a href={LEGAL.parentSite} rel="noopener noreferrer">
          Rondanini Publishing
        </a>
      </nav>

      <p className={styles.copy}>
        © {year} {LEGAL.companyName}. {LEGAL.imprint}.
      </p>
      <p className={styles.reg}>{companyRegistrationLine()}</p>
    </footer>
  );
}
