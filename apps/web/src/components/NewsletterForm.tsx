"use client";

import { useState, type FormEvent } from "react";
import styles from "./NewsletterForm.module.css";

type Props = {
  idPrefix: string;
  variant?: "hero" | "footer";
};

export function NewsletterForm({ idPrefix, variant = "footer" }: Props) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "pending" | "ok" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  const inputId = `${idPrefix}-newsletter-email`;

  async function onSubscribe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("pending");
    setMessage(null);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        hint?: string;
        doubleOptIn?: boolean;
        welcome?: boolean;
      };
      if (!res.ok || !data.ok) {
        const detail = [data.error, data.hint].filter(Boolean).join(" — ");
        throw new Error(detail || "Subscribe failed");
      }
      setStatus("ok");
      setMessage(
        data.doubleOptIn
          ? "Check your email to confirm."
          : data.welcome
            ? "Subscribed. The welcome letter is on its way."
            : "Subscribed. Thank you.",
      );
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Subscribe failed");
    }
  }

  return (
    <form
      className={styles.form}
      data-variant={variant}
      action="/api/newsletter/subscribe"
      method="post"
      onSubmit={onSubscribe}
    >
      <label className={styles.label} htmlFor={inputId}>
        Newsletter
      </label>
      <p className={styles.lede}>New species when they go public.</p>
      <div className={styles.row}>
        <input
          id={inputId}
          className={styles.input}
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
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={company}
          onChange={(ev) => setCompany(ev.target.value)}
          style={{
            position: "absolute",
            left: "-9999px",
            opacity: 0,
            height: 0,
            width: 0,
          }}
        />
        <button
          type="submit"
          className={styles.submit}
          disabled={status === "pending"}
        >
          {status === "pending" ? "Sending…" : "Subscribe"}
        </button>
      </div>
      {message && (
        <p
          className={styles.status}
          role={status === "error" ? "alert" : "status"}
          data-state={status}
        >
          {message}
        </p>
      )}
    </form>
  );
}
