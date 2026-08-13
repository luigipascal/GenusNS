"use client";

import { useState } from "react";
import Link from "next/link";
import {
  applyWizardCompositionChoice,
  GENUS_POLICY_BANNER,
  STUDIO_PUBLISHING_DISPLAY,
  WIZARD_COMPOSITION_OPTIONS,
  WIZARD_COMPOSITION_QUESTION,
  type WizardCompositionChoice,
  type RightsPolicyBundle,
} from "@genusns/rights";
import styles from "../doc.module.css";
import studio from "./studio.module.css";

export default function StudioRightsPage() {
  const [choice, setChoice] = useState<WizardCompositionChoice>("fully_machine");
  const [confirmed, setConfirmed] = useState(false);
  const [operator, setOperator] = useState("Neural Syntax");
  const [result, setResult] = useState<{
    rights: RightsPolicyBundle;
    auditLogged: boolean;
  } | null>(null);

  function apply() {
    const { rights, auditEvent } = applyWizardCompositionChoice(choice, {
      operator,
      confirmed,
    });
    setResult({ rights, auditLogged: Boolean(auditEvent) || confirmed });
  }

  return (
    <main className={styles.doc}>
      <header className={styles.bar}>
        <Link href="/" className="mono">
          GENUS//NS
        </Link>
        <span className="mono">STUDIO · RIGHTS</span>
      </header>

      <h1>Release rights</h1>
      <p className={styles.lede}>
        Project policy for composition claims and master revenue — not an
        automated legal determination. Distributor submission remains manual.
      </p>

      <section className={studio.stage}>
        <h2 className="mono">{WIZARD_COMPOSITION_QUESTION}</h2>
        <div className={studio.options} role="radiogroup">
          {WIZARD_COMPOSITION_OPTIONS.map((opt) => (
            <label key={opt.id} className={studio.option}>
              <input
                type="radio"
                name="composition_how"
                value={opt.id}
                checked={choice === opt.id}
                onChange={() => {
                  setChoice(opt.id);
                  setResult(null);
                }}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>

        {choice === "fully_machine" && (
          <aside className={studio.banner}>
            <p className="mono">{GENUS_POLICY_BANNER.title}</p>
            <p style={{ whiteSpace: "pre-line" }}>{GENUS_POLICY_BANNER.body}</p>
            <dl className={studio.defaults}>
              <div>
                <dt>Publishing registration</dt>
                <dd>OFF</dd>
              </div>
              <div>
                <dt>Master revenue collection</dt>
                <dd>ON</dd>
              </div>
            </dl>
            <div className={studio.pubDisplay} title={STUDIO_PUBLISHING_DISPLAY.tooltip}>
              <p className="mono">{STUDIO_PUBLISHING_DISPLAY.heading}</p>
              <p>
                <strong>{STUDIO_PUBLISHING_DISPLAY.status}</strong>
              </p>
              <p>{STUDIO_PUBLISHING_DISPLAY.detail}</p>
            </div>
          </aside>
        )}

        <label className={studio.operator}>
          <span className="mono">Operator</span>
          <input
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            autoComplete="off"
          />
        </label>

        <label className={studio.confirm}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          <span>Confirm composition status</span>
        </label>

        <button
          type="button"
          className={studio.apply}
          disabled={!confirmed}
          onClick={apply}
        >
          Record rights state
        </button>
      </section>

      {result && (
        <section className={studio.result}>
          <h2 className="mono">RECORDED STATE</h2>
          <pre className="mono">
            {JSON.stringify(
              {
                authorshipStatus: result.rights.composition.authorshipStatus,
                publishingRoyaltyStatus:
                  result.rights.composition.publishingRoyaltyStatus,
                claimedAuthors: result.rights.composition.claimedAuthors,
                publishingRegistration: result.rights.publishingRegistration,
                masterRevenue:
                  result.rights.master.masterRevenueCollectionStatus,
                confirmedBy: result.rights.composition.operatorConfirmedBy,
                confirmedAt: result.rights.composition.operatorConfirmedAt,
              },
              null,
              2,
            )}
          </pre>
          <p className={styles.footNote}>
            Empty claimedAuthors is valid when publishing is not claimed. Do not
            invent a composer for distributor forms.
          </p>
        </section>
      )}
    </main>
  );
}
