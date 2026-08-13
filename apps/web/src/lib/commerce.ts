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

export function trackPricePence(): number {
  return Number(process.env.STRIPE_TRACK_PRICE_GBP_PENCE ?? 299);
}
