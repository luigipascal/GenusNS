import Link from "next/link";
import { LEGAL, companyRegistrationLine } from "@/lib/legal";
import styles from "../doc.module.css";

export const metadata = {
  title: "Terms of Use · GENUS//NS",
  description: `Terms of Use for GENUS//NS, operated under ${LEGAL.imprint}.`,
};

export default function TermsPage() {
  return (
    <main className={styles.doc}>
      <header className={styles.bar}>
        <Link href="/" className="mono">
          GENUS//NS
        </Link>
        <span className="mono">TERMS</span>
      </header>

      <h1>Terms of Use</h1>
      <p className={styles.lede}>
        Effective date: 13 August 2026
        <br />
        Website: GENUS//NS
        <br />
        Operator: {LEGAL.imprint}
      </p>

      <ol className={styles.stages}>
        <li>
          <h2 className="mono">1. AGREEMENT</h2>
          <p>
            By accessing or using the GENUS//NS site (the &quot;Site&quot;), you
            agree to these Terms of Use. If you do not agree, please do not use
            the Site. {LEGAL.companyName} (&quot;we&quot;, &quot;us&quot;),
            trading as {LEGAL.tradingAs}, may update these terms from time to
            time; the effective date above will be revised when we do.
          </p>
        </li>

        <li>
          <h2 className="mono">2. THE SERVICE</h2>
          <p>
            GENUS//NS is a public registry and living interface for a
            computational music experiment: invented musical species, genome
            visualisation, provenance, and related publication materials. We may
            change or discontinue any part of the Site without notice.
          </p>
        </li>

        <li>
          <h2 className="mono">3. NOT PROFESSIONAL ADVICE</h2>
          <p>
            Content on the Site is for general information, listening, and
            cultural / experimental publication. Nothing here is legal,
            investment, or tax advice. Music rights language on the Site
            describes {LEGAL.artist} project policy and factual provenance — it
            is not an automated legal determination for every jurisdiction.
          </p>
        </li>

        <li>
          <h2 className="mono">4. INTELLECTUAL PROPERTY</h2>
          <p>
            The Site&apos;s design, branding, text (where not otherwise
            credited), genome visualisations, and compilation of materials are
            owned by {LEGAL.companyName} or our licensors and are protected by
            copyright and related rights. You may browse and share links; you
            may not scrape, reproduce, or exploit the Site or its content
            commercially without our prior written permission, except as allowed
            by applicable law.
          </p>
          <p>
            Composition authorship and master-side revenue for individual
            releases are recorded per work under the GENUS//NS rights policy.
            Absence of a conventional composer claim does not mean the Site or
            sound recordings are public domain.
          </p>
        </li>

        <li>
          <h2 className="mono">5. PURCHASES AND CONDUCT</h2>
          <p>
            If you purchase a download or service (for example via Stripe), you
            warrant that your information is accurate. You must not misuse the
            Site, attempt unauthorised access, or upload malware or unlawful
            content.
          </p>
        </li>

        <li>
          <h2 className="mono">6. THIRD-PARTY LINKS AND COMMERCE</h2>
          <p>
            The Site may link to third parties (including distributors, DSPs,
            and payment processors). Those sites have their own terms and
            privacy policies. Where we participate in affiliate or platform
            programmes, relationships will be disclosed as required.
          </p>
        </li>

        <li>
          <h2 className="mono">7. DISCLAIMER AND LIABILITY</h2>
          <p>
            The Site is provided &quot;as is&quot;. To the fullest extent
            permitted by law, we disclaim warranties of any kind and are not
            liable for any indirect or consequential loss arising from your use
            of the Site or reliance on its content. Nothing in these terms
            excludes or limits liability that cannot be excluded or limited
            under English law.
          </p>
        </li>

        <li>
          <h2 className="mono">8. GOVERNING LAW</h2>
          <p>
            These terms are governed by the laws of England and Wales. The
            courts of England and Wales have exclusive jurisdiction, subject to
            mandatory rights you may have as a consumer elsewhere.
          </p>
        </li>

        <li>
          <h2 className="mono">CONTACT</h2>
          <p>
            Email: {LEGAL.emailInfo}
            <br />
            Registered office: {LEGAL.registeredOffice}
            <br />
            Company No.: {LEGAL.companyNo} ({LEGAL.jurisdiction})
            <br />
            Trading as: {LEGAL.tradingAs}
          </p>
          <p className={styles.footNote}>{companyRegistrationLine()}</p>
        </li>
      </ol>
    </main>
  );
}

