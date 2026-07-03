import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";
import { SITE_CONFIG } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_CONFIG.url;

  // Static pages
  const staticPages = [
    { path: "", priority: 1.0, changeFreq: "daily" as const },
    { path: "/catalog", priority: 0.9, changeFreq: "daily" as const },
    { path: "/promotions", priority: 0.7, changeFreq: "daily" as const },
    { path: "/game", priority: 0.6, changeFreq: "weekly" as const },
    { path: "/auth/login", priority: 0.3, changeFreq: "monthly" as const },
    { path: "/auth/register", priority: 0.5, changeFreq: "monthly" as const },
    { path: "/cart", priority: 0.2, changeFreq: "monthly" as const },
  ];

  // Product pages
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, updatedAt: true },
      take: 1000,
    });

    productPages = products.map((p) => ({
      url: `${baseUrl}/catalog/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  } catch {
    // DB not available during build
  }

  return [
    ...staticPages.map((p) => ({
      url: `${baseUrl}${p.path}`,
      lastModified: new Date(),
      changeFrequency: p.changeFreq,
      priority: p.priority,
    })),
    ...productPages,
  ];
}
