import Link from "next/link";
import styles from "./SiteHeader.module.css";

const LINKS = [
  { href: "/catalogue", label: "Catalogue" },
  { href: "/registry", label: "Registry" },
  { href: "/about", label: "About" },
] as const;

export function SiteHeader() {
  return (
    <header className={styles.bar}>
      <Link href="/" className={`${styles.mark} mono`}>
        GENUS//NS
      </Link>
      <nav className={`${styles.nav} mono`} aria-label="Site">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href}>
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
