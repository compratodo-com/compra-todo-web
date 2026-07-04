"use client";

import Link from "next/link";
import { Badge } from "@/components/ui";

interface ArticleCardProps {
  article: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    imageUrl: string | null;
    category: string;
    publishedAt: string | null;
    featured?: boolean;
  };
}

const CATEGORY_STYLES: Record<string, { icon: string; color: string }> = {
  lifestyle: { icon: "🌿", color: "bg-green-100 text-green-700" },
  shopping: { icon: "🛍️", color: "bg-purple-100 text-purple-700" },
  wellness: { icon: "🧘", color: "bg-blue-100 text-blue-700" },
  trends: { icon: "🔥", color: "bg-orange-100 text-orange-700" },
};

export function ArticleCard({ article }: ArticleCardProps) {
  const cat = CATEGORY_STYLES[article.category] || CATEGORY_STYLES.lifestyle;

  return (
    <Link href={`/articles/${article.slug}`} className="block group col-span-2 md:col-span-1">
      <article className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-purple-200 transition-all duration-200 h-full">
        {/* Imagen de gran tamaño */}
        <div className="relative aspect-[16/9] md:aspect-[2/1] bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">
              📰
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cat.color}`}>
              {cat.icon} {article.category}
            </span>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-2 mb-2">
            {article.title}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">
            {article.excerpt}
          </p>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              {article.publishedAt
                ? new Date(article.publishedAt).toLocaleDateString("es-CL", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Próximamente"}
            </span>
            <span className="text-sm font-medium text-purple-600 group-hover:text-purple-700">
              Leer más →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function FeaturedArticleCard({ article }: ArticleCardProps) {
  const cat = CATEGORY_STYLES[article.category] || CATEGORY_STYLES.lifestyle;

  return (
    <Link href={`/articles/${article.slug}`} className="block group">
      <article className="bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-800 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-200">
        <div className="grid md:grid-cols-2">
          {/* Imagen */}
          <div className="relative aspect-[4/3] md:aspect-auto md:h-full min-h-[250px] bg-purple-800 overflow-hidden">
            {article.imageUrl ? (
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl opacity-20">
                📰
              </div>
            )}
          </div>

          {/* Contenido */}
          <div className="p-6 md:p-8 flex flex-col justify-center text-white">
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 text-white`}>
                {cat.icon} {article.category}
              </span>
              {article.featured && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-400 text-purple-900">
                  ⭐ Destacado
                </span>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-3">
              {article.title}
            </h2>
            <p className="text-purple-200 text-sm md:text-base leading-relaxed line-clamp-3">
              {article.excerpt}
            </p>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/20">
              <span className="text-sm text-purple-300">
                {article.publishedAt
                  ? new Date(article.publishedAt).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Próximamente"}
              </span>
              <span className="text-sm font-medium text-yellow-300 group-hover:text-yellow-200">
                Leer artículo completo →
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
