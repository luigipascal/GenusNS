import Link from "next/link";
import { LEGAL, companyRegistrationLine } from "@/lib/legal";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  const year = new Date().getUTCFullYear();

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
