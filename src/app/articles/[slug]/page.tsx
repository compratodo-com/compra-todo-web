import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) return buildMetadata({ title: "Artículo no encontrado" });

  return buildMetadata({
    title: `${article.title} | Compra-Todo Magazine`,
    description: article.excerpt,
    path: `/articles/${article.slug}`,
    image: article.imageUrl || undefined,
  });
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({
    where: { slug },
  });

  if (!article) notFound();

  // Artículos relacionados
  const related = await prisma.article.findMany({
    where: {
      category: article.category,
      id: { not: article.id },
      publishedAt: { not: null },
    },
    take: 3,
    orderBy: { publishedAt: "desc" },
    select: { title: true, slug: true, excerpt: true, imageUrl: true, category: true },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-purple-600">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/articles" className="hover:text-purple-600">Artículos</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{article.title.slice(0, 40)}</span>
      </nav>

      {/* Imagen destacada */}
      {article.imageUrl && (
        <div className="relative aspect-[2/1] rounded-2xl overflow-hidden mb-8 bg-gray-100">
          <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
            {article.category}
          </span>
          <span className="text-sm text-gray-400">
            {article.publishedAt && new Date(article.publishedAt).toLocaleDateString("es-CL", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
          {article.title}
        </h1>
        <p className="text-lg text-gray-500 mt-3">{article.excerpt}</p>
      </div>

      {/* Contenido del artículo */}
      <div className="prose prose-lg max-w-none mb-12">
        {article.content.split("\n").map((paragraph, i) => (
          <p key={i} className="text-gray-700 leading-relaxed mb-4">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Artículos relacionados */}
      {related.length > 0 && (
        <section className="border-t pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            📖 Artículos relacionados
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {related.map((r) => (
              <Link key={r.slug} href={`/articles/${r.slug}`} className="group">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                  {r.imageUrl && (
                    <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
                      <img src={r.imageUrl} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 line-clamp-2">
                      {r.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{r.excerpt}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <div className="mt-12 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-8 text-center text-white">
        <h3 className="text-2xl font-bold mb-2">¿Listo para explorar?</h3>
        <p className="text-purple-100 mb-4">Descubre productos que combinan con tu estilo de vida</p>
        <Link href="/catalog">
          <Button className="bg-white text-purple-700 hover:bg-gray-100 font-bold">
            🛍️ Explorar catálogo
          </Button>
        </Link>
      </div>
    </div>
  );
}
