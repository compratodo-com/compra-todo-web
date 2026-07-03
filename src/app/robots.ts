import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/agents/", "/_next/"],
    },
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
  };
}
