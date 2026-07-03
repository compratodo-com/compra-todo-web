import type { Metadata } from "next";
import CatalogClient from "./catalog-client";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Catálogo de tendencias — Explora productos sin gastar",
  description:
    "Descubre los productos que están marcando tendencia en Chile y Latinoamérica. Navega miles de artículos, compara precios y encuentra tu próxima compra favorita. Todo sin gastar dinero real.",
  path: "/catalog",
});

export default function CatalogPage() {
  return <CatalogClient />;
}
