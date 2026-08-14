import Link from "next/link";
import styles from "../../doc.module.css";

export const metadata = {
  title: "Unsubscribed · GENUS//NS",
};

export default async function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;
  const success = ok !== "0";
  return (
    <main className={styles.doc}>
      <header className={styles.bar}>
        <Link href="/" className="mono">
          GENUS//NS
        </Link>
        <span className="mono">NEWSLETTER</span>
      </header>
      <h1>{success ? "Unsubscribed" : "Could not unsubscribe"}</h1>
      <p className={styles.lede}>
        {success
          ? "You will not receive the welcome letter or Saturday bulletins from this list."
          : "The unsubscribe link was invalid or the list could not be updated. Use the link in the latest email, or write to privacy@rondanini.com."}
      </p>
      <p>
        <Link href="/" className="mono">
          Back to GENUS//NS
        </Link>
      </p>
    </main>
  );
}
