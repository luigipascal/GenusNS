import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeContent: "center",
        gap: "1rem",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <p className="mono" style={{ letterSpacing: "0.2em", margin: 0 }}>
        SPECIES NOT FOUND
      </p>
      <p style={{ color: "var(--gns-fg-muted)", margin: 0 }}>
        The requested identifier does not exist in the registry.
      </p>
      <Link href="/registry" className="mono" style={{ letterSpacing: "0.18em" }}>
        ENTER REGISTRY
      </Link>
    </main>
  );
}
