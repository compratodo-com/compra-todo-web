import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { ArticleCard, FeaturedArticleCard } from "@/components/articles/ArticleCard";
import { TravelCard } from "@/components/travel/TravelCard";
import { prisma } from "@/lib/db/prisma";
import { buildMetadata, SEO_COPIES } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = buildMetadata({
  title: "La nueva forma de comprar online — Experiencia de compra sin gastar",
  description:
    "Descubre Compra-Todo: navega miles de productos reales, compara tendencias, arma tu carrito perfecto y vive la emoción del unboxing. Todo sin gastar un peso. La experiencia de compra más innovadora de Latinoamérica.",
});

async function getFeaturedProducts() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: [{ isFeatured: "desc" }, { soldQuantity: "desc" }],
      take: 8,
      include: { category: { select: { name: true } } },
    });

    return products.map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      originalPrice: p.originalPrice,
      thumbnail: p.thumbnail,
      images: p.images,
      discount: p.originalPrice
        ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
        : 0,
      soldQuantity: p.soldQuantity,
      tags: p.tags,
      categoryName: p.category?.name || null,
    }));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  // Obtener paquetes de viaje destacados
  const travelPackages = await prisma.travelPackage.findMany({
    where: { isActive: true },
    orderBy: [{ promotional: "desc" }, { createdAt: "desc" }],
    take: 4,
  });

  // Obtener artículos publicados
  const articles = await prisma.article.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    take: 4,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      imageUrl: true,
      category: true,
      featured: true,
      publishedAt: true,
    },
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm mb-4 md:mb-6">
                <span>✨</span>
                <span>Nueva experiencia de compra</span>
              </div>
              <h1 className="text-3xl md:text-6xl font-bold leading-tight mb-3 md:mb-4">
                {SEO_COPIES.heroTitle}
              </h1>
              <p className="text-base md:text-lg text-purple-100 mb-6 md:mb-8 leading-relaxed">
                {SEO_COPIES.heroSubtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <Link href="/catalog" className="flex-1 md:flex-none">
                  <Button
                    size="lg"
                    className="w-full md:w-auto bg-yellow-400 text-purple-900 hover:bg-yellow-300 font-bold text-base md:text-lg"
                  >
                    🛍️ {SEO_COPIES.heroCTA}
                  </Button>
                </Link>
                <Link href="/auth/register" className="flex-1 md:flex-none">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full md:w-auto border-white text-white hover:bg-white/20 text-base md:text-lg"
                  >
                    Crear cuenta gratis
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative hidden md:block">
              <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-3xl" />
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="text-center mb-6">
                  <span className="text-6xl">🛒</span>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: "📦", text: "Miles de productos para explorar" },
                    { icon: "🎡", text: "Sorteos y experiencias en cada visita" },
                    { icon: "🚚", text: "Tracking en vivo de tus pedidos" },
                    { icon: "🪙", text: "Acumula puntos y beneficios" },
                    { icon: "🏆", text: "Descubre productos en tendencia" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-2"
                    >
                      <span>{item.icon}</span>
                      <span className="text-sm">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              🔥 {SEO_COPIES.catalogTitle}
            </h2>
            <p className="text-gray-500 mt-1">{SEO_COPIES.catalogDesc}</p>
          </div>
          <Link
            href="/catalog"
            className="text-purple-600 hover:text-purple-700 font-medium text-sm"
          >
            Explorar catálogo completo →
          </Link>
        </div>
        <ProductGrid products={featuredProducts} />
      </section>

      {/* Travel Section */}
      {travelPackages.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                🧳 Viajes y destinos
              </h2>
              <p className="text-gray-500 mt-1">
                Los mejores paquetes para latinoamericanos
              </p>
            </div>
            <a href="/travel" className="text-purple-600 hover:text-purple-700 font-medium text-sm">
              Ver todos →
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {travelPackages.map((pkg) => (
              <TravelCard
                key={pkg.id}
                pkg={{
                  id: pkg.id,
                  title: pkg.title,
                  slug: pkg.slug,
                  destination: pkg.destination,
                  price: pkg.price,
                  originalPrice: pkg.originalPrice,
                  thumbnail: pkg.thumbnail,
                  images: pkg.images,
                  duration: pkg.duration,
                  includes: pkg.includes,
                  rating: pkg.rating,
                  tags: pkg.tags,
                  promotional: pkg.promotional,
                  discountPct: pkg.discountPct,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Articles Section */}
      {articles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                📖 Magazine
              </h2>
              <p className="text-gray-500 mt-1">
                Estilo de vida, tendencias y bienestar
              </p>
            </div>
            <a
              href="/articles"
              className="text-purple-600 hover:text-purple-700 font-medium text-sm"
            >
              Ver todos →
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {articles.map((article, index) => (
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
                  featured: article.featured,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
            {SEO_COPIES.featuresTitle}
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
            Una plataforma diseñada para que disfrutes la emoción de comprar
            sin preocuparte por el precio. Porque la mejor experiencia de
            compra es la que no tiene límites.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Explora sin límites</h3>
              <p className="text-sm text-gray-500">
                Navega miles de productos reales. Marca tus favoritos, compara precios, descubre tendencias.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Vive la experiencia</h3>
              <p className="text-sm text-gray-500">
                Arma tu carrito perfecto, recibe tracking en vivo, y siente la emoción de cada compra.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💎</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Cero riesgo</h3>
              <p className="text-sm text-gray-500">
                La mejor parte: no gastas dinero real. Descubre, compara y disfruta sin compromiso.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-600 to-indigo-700 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            ¿Listo para una nueva forma de comprar?
          </h2>
          <p className="text-purple-100 mb-8 text-lg">
            Únete a miles de personas que ya descubrieron la experiencia de
            compra más innovadora de Latinoamérica.
          </p>
          <Link href="/auth/register">
            <Button
              size="lg"
              className="bg-white text-purple-700 hover:bg-gray-100 font-bold text-lg"
            >
              Crear cuenta gratis — Empieza ahora
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
