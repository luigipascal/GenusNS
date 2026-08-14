import type { MetadataRoute } from "next";
import { listLiveExperiments } from "@/lib/liveCatalog";

function origin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://genusns.com"
  );
}

const STATIC_PATHS = [
  "",
  "/catalogue",
  "/registry",
  "/listen",
  "/about",
  "/method",
  "/services",
  "/transparency",
  "/compare",
  "/privacy",
  "/terms",
  "/studio",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = origin();
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/catalogue" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/catalogue" || path === "/registry" ? 0.8 : 0.5,
  }));

  const experiments = await listLiveExperiments();
  const seen = new Set<string>();
  const genomeEntries: MetadataRoute.Sitemap = [];
  for (const e of experiments) {
    if (e.canonicalId === "VISUAL INTERPOLATION") continue;
    const id = e.digest.slice(0, 6).toLowerCase();
    if (id.length < 6 || seen.has(id)) continue;
    seen.add(id);
    genomeEntries.push({
      url: `${base}/g/${id}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return [...staticEntries, ...genomeEntries];
}
