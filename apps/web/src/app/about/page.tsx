import Link from "next/link";
import styles from "../doc.module.css";

export const metadata = {
  title: "About · GENUS//NS",
  description:
    "GENUS//NS is a Neural Syntax publication experiment: music for genres that do not exist yet, with transparent provenance and genome-driven identity.",
};

export default function AboutPage() {
  return (
    <main className={styles.doc}>
      <header className={styles.bar}>
        <Link href="/" className="mono">
          GENUS//NS
        </Link>
        <span className="mono">ABOUT</span>
      </header>

      <h1>Site description</h1>
      <p className={styles.lede}>
        GENUS//NS is the public face of a computational music experiment operated
        by Neural Syntax and published by 0dB_Labs. It is not a streaming clone
        and not a record-label brochure. It is a registry of invented musical
        species — each with a formal genome, a living interface, and a clear
        record of what machines did and what humans decided.
      </p>

      <section className={styles.grid}>
        <div>
          <h2 className="mono">WHAT YOU HEAR</h2>
          <p>
            Tracks grown from Genre Genesis genomes: mathematical laws for
            tuning, rhythm, form and spectrum, realised in Genus desktop, then
            published here with provenance intact.
          </p>
        </div>
        <div>
          <h2 className="mono">WHAT YOU SEE</h2>
          <p>
            Every species carries a genome glyph — a wheel derived from its EDO,
            cycle, accents and digest. Covers, the registry field, and the
            artist mark are projections of that law, not decoration.
          </p>
        </div>
        <div>
          <h2 className="mono">WHO IS WHO</h2>
          <p>
            <strong>Genus</strong> is the desktop laboratory.{" "}
            <strong>GENUS//NS</strong> is the artist and public experiment.{" "}
            <strong>Neural Syntax</strong> is the operator.{" "}
            <strong>0dB_Labs</strong> is the label.
          </p>
        </div>
        <div>
          <h2 className="mono">COMMERCE</h2>
          <p>
            Listen on the site. Buy downloads and commission services through
            Stripe. Distribution to stores goes through Ditto Music — the only
            step that stays manual.
          </p>
        </div>
      </section>

      <p className={styles.footNote}>
        Tagline: music for genres that do not exist yet. The website should
        behave as though it is another realisation of the experiment.
      </p>

      <p className={styles.footNote}>
        <Link href="/services">Services</Link>
        {" · "}
        <Link href="/method">Method</Link>
        {" · "}
        <Link href="/transparency">Transparency</Link>
        {" · "}
        <Link href="/registry">Registry</Link>
      </p>
    </main>
  );
}
