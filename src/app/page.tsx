import Link from "next/link";
import { Button } from "@/components/ui";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { prisma } from "@/lib/db/prisma";

// Disable static prerendering - this page needs a database connection
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  } catch (error) {
    console.error("[Home] DB not available, using empty catalog:", error);
    return [];
  }
}

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm mb-6">
                <span>🎮</span>
                <span>Simulador de compras — Chile</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
                Compra sin
                <span className="text-yellow-300"> gastar</span>
              </h1>
              <p className="text-lg text-purple-100 mb-8 leading-relaxed">
                La experiencia de compra online más realista. Navega miles de
                productos reales, aprovecha ofertas, gira la ruleta y sigue tus
                pedidos por 48 horas como si fueran despachos verdaderos.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/catalog">
                  <Button
                    size="lg"
                    className="bg-yellow-400 text-purple-900 hover:bg-yellow-300 font-bold text-lg"
                  >
                    🛍️ Empezar a comprar
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white text-white hover:bg-white/20"
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
                    { icon: "📦", text: "Catálogo con productos reales" },
                    { icon: "🎡", text: "Ruleta de premios cada compra" },
                    { icon: "🚚", text: "Tracking realista 24-48 hrs" },
                    { icon: "🪙", text: "Gana CompraCoins y sube de nivel" },
                    { icon: "🏆", text: "Misiones, colecciones y ranking" },
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
              🔥 Lo más popular
            </h2>
            <p className="text-gray-500 mt-1">
              Lo que Chile está comprando (en el juego)
            </p>
          </div>
          <Link
            href="/catalog"
            className="text-purple-600 hover:text-purple-700 font-medium text-sm"
          >
            Ver catálogo completo →
          </Link>
        </div>
        <ProductGrid products={featuredProducts} />
      </section>

      {/* How it works */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            ¿Cómo funciona?
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                icon: "🔍",
                title: "Elige",
                desc: "Navega miles de productos reales con precios actualizados",
              },
              {
                step: "2",
                icon: "🎡",
                title: "Gira",
                desc: "Gana descuentos y monedas en la ruleta pre-compra",
              },
              {
                step: "3",
                icon: "📦",
                title: "Compra",
                desc: "Usa tu dinero simulado y recibe seguimiento realista",
              },
              {
                step: "4",
                icon: "🏆",
                title: "Sube",
                desc: "Acumula coins, completa misiones y llega a Leyenda",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
          <p className="text-sm text-yellow-800 font-medium">
            ⚠️ <strong>Compra-Todo es un simulador de compras.</strong> Todos
            los productos, ofertas y seguimientos son parte de un juego con
            fines de entretenimiento. No se realizará ningún despacho de
            productos reales. No solicitamos medios de pago reales.
          </p>
        </div>
      </section>
    </div>
  );
}
