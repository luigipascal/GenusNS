import Link from "next/link";
import { LEGAL } from "@/lib/legal";
import styles from "./SiteHeader.module.css";

const LINKS = [
  { href: "/catalogue", label: "Catalogue" },
  { href: "/registry", label: "Registry" },
  { href: "/podcast", label: "Podcast" },
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
        <a
          href={LEGAL.forumUrl}
          rel="noopener noreferrer"
          target="_blank"
          title={LEGAL.forumLabel}
        >
          Forum
        </a>
        <a
          href={LEGAL.youtubeUrl}
          rel="noopener noreferrer"
          target="_blank"
          title={LEGAL.youtubeLabel}
        >
          YouTube
        </a>
      </nav>
    </header>
  );
}
