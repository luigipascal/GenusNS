import type { Metadata } from "next";
import { CatalogueClient } from "./catalogue-client";

export const metadata: Metadata = {
  title: "Catalogue",
  description:
    "Every GENUS//NS species: cover, tuning, meter, form, and listen or buy when published.",
};

export default function CataloguePage() {
  return <CatalogueClient />;
}
