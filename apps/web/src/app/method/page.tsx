import Link from "next/link";
import styles from "../doc.module.css";

export default function MethodPage() {
  return (
    <main className={styles.doc}>
      <header className={styles.bar}>
        <Link href="/" className="mono">
          GENUS//NS
        </Link>
        <span className="mono">METHOD</span>
      </header>

      <h1>How a species is made</h1>
      <p className={styles.lede}>
        GENUS//NS publishes experiments produced in Genus desktop. The website
        does not invent genres or generate music. It receives evidence.
      </p>

      <ol className={styles.stages}>
        <li>
          <h2 className="mono">LAW</h2>
          <p>
            Genre Genesis proposes mathematical / descriptive genomes. A human
            operator approves. The genome compiles into a pack Compose can use.
          </p>
        </li>
        <li>
          <h2 className="mono">REALISATION</h2>
          <p>
            Compose instantiates the law as candidate audio. The operator
            selects a realisation.
          </p>
        </li>
        <li>
          <h2 className="mono">REFINEMENT</h2>
          <p>
            Refine analyses performance, applies named DSP modules, and
            re-analyses. Composition and arrangement stay intact — only the
            performance layer changes.
          </p>
        </li>
        <li>
          <h2 className="mono">SELECTION</h2>
          <p>
            The operator accepts a final master. Human decision points are
            first-class provenance, not footnotes.
          </p>
        </li>
        <li>
          <h2 className="mono">PUBLICATION</h2>
          <p>
            An immutable snapshot is sent to GENUS//NS. Hashes are verified.
            Releases, kits, and the public registry are built here.
          </p>
        </li>
      </ol>

      <p className={styles.footNote}>
        This is not a fully autonomous pipeline. Machines invent and measure;
        humans approve, select, and publish.
      </p>
    </main>
  );
}
