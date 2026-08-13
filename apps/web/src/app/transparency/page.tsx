import Link from "next/link";
import styles from "../doc.module.css";

export default function TransparencyPage() {
  return (
    <main className={styles.doc}>
      <header className={styles.bar}>
        <Link href="/" className="mono">
          GENUS//NS
        </Link>
        <span className="mono">TRANSPARENCY</span>
      </header>

      <h1>What machines did. What humans did.</h1>
      <p className={styles.lede}>
        Transparency is calm on purpose. Provenance lives in the registry —
        not in unreliable WAV comments.
      </p>

      <section className={styles.grid}>
        <div>
          <h2 className="mono">MACHINES</h2>
          <ul>
            <li>Propose and score genre genomes</li>
            <li>Compile packs and formal events</li>
            <li>Generate candidate realisations</li>
            <li>Measure performance proxies</li>
            <li>Apply named DSP when instructed</li>
          </ul>
        </div>
        <div>
          <h2 className="mono">HUMANS</h2>
          <ul>
            <li>Approve genomes</li>
            <li>Select candidates</li>
            <li>Accept refinement</li>
            <li>Approve releases</li>
            <li>Publish and enter DSP links</li>
          </ul>
        </div>
        <div>
          <h2 className="mono">CHANGED</h2>
          <ul>
            <li>Performance-layer timing, dynamics, expression…</li>
            <li>Master loudness / distribution packaging</li>
          </ul>
        </div>
        <div>
          <h2 className="mono">PRESERVED</h2>
          <ul>
            <li>Musical law / genome artefacts</li>
            <li>Composition and arrangement</li>
            <li>Tier-0 provenance detections after cleaning</li>
          </ul>
        </div>
      </section>

      <p className={styles.footNote}>
        Genus performance realism, synthetic trace, MERT likeness, and external
        Let’s Submit scores are different measurements. None of them is
        labelled “AI probability” on this site.
      </p>
      <p className={styles.footNote}>
        Composition publishing royalties for fully machine-generated GENUS works
        are not claimed by default; master-side distribution revenue may still
        be collected. See Privacy / Terms and the TRACE rights blocks for
        project policy language. Publisher: Rondanini Publishing Ltd t/a
        0dB_Labs.
      </p>
    </main>
  );
}
