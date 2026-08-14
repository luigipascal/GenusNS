export const SERVICE_CATALOG: Record<
  string,
  { name: string; unitAmount: number; description: string; priceLabel: string }
> = {
  "genome-commission": {
    name: "GENUS//NS — Genome commission",
    unitAmount: 45000,
    description: "Custom genome pack + species record",
    priceLabel: "from £450",
  },
  "refine-master": {
    name: "GENUS//NS — Refine & master consult",
    unitAmount: 18000,
    description: "Performance-layer analysis consult",
    priceLabel: "from £180",
  },
  "release-kit": {
    name: "GENUS//NS — Release kit",
    unitAmount: 9000,
    description: "Cover, artist mark, Ditto-ready pack",
    priceLabel: "from £90",
  },
};

/** What one species purchase includes — shown to buyers before/after pay. */
export const TRACK_PACKAGE_CONTENTS = [
  {
    id: "master",
    label: "Genus master audio (≤2 min)",
    detail: "Realised from the locked compose instruction",
  },
  {
    id: "cover",
    label: "Cover art (cover.png)",
    detail: "3000×3000 genome-wheel cover for this species",
  },
  {
    id: "law",
    label: "Raw law (LAW.json)",
    detail: "Tuning, meter, form, spectrum — the formal genome",
  },
  {
    id: "compose",
    label: "Compose instruction",
    detail: "Exact prompt Genus used to generate the master",
  },
  {
    id: "brief",
    label: "Foundry brief + prompts pack",
    detail: "foundry_brief.json and prompts.json from compile",
  },
  {
    id: "midi",
    label: "Loop sketch MIDI",
    detail: "loop_approx.mid — law sketch, not the release master",
  },
  {
    id: "grid",
    label: "Grid / tuning / form artefacts",
    detail: "grid.json, tuning.json, form_path.json, events.json",
  },
  {
    id: "manifest",
    label: "Manifest + genre definition",
    detail: "Compiled pack identity and law snapshot",
  },
] as const;

export function trackPackageStripeDescription(trackId: string): string {
  const id = trackId.toUpperCase().slice(0, 6);
  // Stripe product description max ~500 chars — keep exhaustive list on-site.
  return (
    `GENUS//NS:${id} full package (one price): Genus master ≤2min, cover.png, ` +
    `LAW.json, compose instruction, foundry brief + prompts, loop MIDI, ` +
    `grid/tuning/form artefacts, manifest. Not audio-only.`
  );
}

export function trackPricePence(): number {
  return Number(process.env.STRIPE_TRACK_PRICE_GBP_PENCE ?? 199);
}

