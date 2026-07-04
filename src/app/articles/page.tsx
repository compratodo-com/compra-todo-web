import { prisma } from "@/lib/db/prisma";
import { ArticleCard, FeaturedArticleCard } from "@/components/articles/ArticleCard";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Magazine — Estilo de vida, compras y bienestar | Compra-Todo",
  description:
    "Descubre artículos sobre tendencias de consumo, estilo de vida, bienestar y las mejores experiencias de compra. Inspírate para tu próxima compra.",
  path: "/articles",
});

export default async function ArticlesPage() {
  const [featured, articles] = await Promise.all([
    prisma.article.findFirst({
      where: { publishedAt: { not: null }, featured: true },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.article.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      take: 12,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        imageUrl: true,
        category: true,
        tags: true,
        featured: true,
        publishedAt: true,
      },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          📖 Compra-Todo Magazine
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Inspírate con artículos sobre tendencias, estilo de vida, bienestar y la mejor experiencia de compra.
        </p>
      </div>

      {/* Artículo destacado */}
      {featured && (
        <div className="mb-10">
          <FeaturedArticleCard
            article={{
              id: featured.id,
              title: featured.title,
              slug: featured.slug,
              excerpt: featured.excerpt,
              imageUrl: featured.imageUrl,
              category: featured.category,
              publishedAt: featured.publishedAt?.toISOString() || null,
              featured: true,
            }}
          />
        </div>
      )}

      {/* Grid de artículos (2 columnas, igual que productos) */}
      {articles.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl">📰</span>
          <h2 className="text-xl font-semibold text-gray-900 mt-4">
            Próximamente
          </h2>
          <p className="text-gray-500 mt-2">
            Estamos preparando contenido increíble para ti
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={{
                id: article.id,
                title: article.title,
                slug: article.slug,
                excerpt: article.excerpt,
                imageUrl: article.imageUrl,
                category: article.category,
                publishedAt: article.publishedAt?.toISOString() || null,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
