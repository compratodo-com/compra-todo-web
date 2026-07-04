import { prisma } from "@/lib/db/prisma";
import { TravelCard } from "@/components/travel/TravelCard";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Viajes y paquetes turísticos — Las mejores ofertas | Compra-Todo",
  description: "Descubre los destinos más atractivos para latinoamericanos. Paquetes turísticos con vuelo, hotel y actividades incluidas. Las mejores ofertas de viaje.",
  path: "/travel",
});

export default async function TravelPage() {
  const [promotional, packages] = await Promise.all([
    prisma.travelPackage.findFirst({
      where: { isActive: true, promotional: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.travelPackage.findMany({
      where: { isActive: true },
      orderBy: [{ promotional: "desc" }, { createdAt: "desc" }],
      take: 20,
    }),
  ]);

  // Obtener regiones únicas para filtrar
  const regions = [...new Set(packages.flatMap(p => p.tags.filter(t => ["Sudamérica", "Caribe", "Norteamérica", "Europa", "Patagonia", "Asia", "Oriente Medio"].includes(t))))];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-purple-100 px-4 py-1.5 rounded-full text-sm text-purple-700 mb-4">
          <span>🧳</span>
          <span>Nueva sección</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          Viajes y paquetes turísticos
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Los destinos más atractivos para latinoamericanos. Precios reales, ofertas increíbles.
        </p>
      </div>

      {/* Filtros de región */}
      {regions.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
          <a href="/travel" className="px-4 py-2 rounded-full text-sm font-medium bg-purple-600 text-white whitespace-nowrap">
            Todos
          </a>
          {regions.map(r => (
            <a key={r} href={`/travel?region=${r}`} className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 whitespace-nowrap">
              {r}
            </a>
          ))}
        </div>
      )}

      {/* Paquete destacado */}
      {promotional && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🏆 Oferta destacada</h2>
          <TravelCard
            pkg={{
              id: promotional.id,
              title: promotional.title,
              slug: promotional.slug,
              destination: promotional.destination,
              price: promotional.price,
              originalPrice: promotional.originalPrice,
              thumbnail: promotional.thumbnail,
              images: promotional.images,
              duration: promotional.duration,
              includes: promotional.includes,
              rating: promotional.rating,
              tags: promotional.tags,
              promotional: promotional.promotional,
              discountPct: promotional.discountPct,
            }}
            featured={true}
          />
        </div>
      )}

      {/* Grid de paquetes */}
      {packages.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl">🧳</span>
          <h2 className="text-xl font-semibold text-gray-900 mt-4">Próximamente</h2>
          <p className="text-gray-500 mt-2">Estamos preparando los mejores paquetes de viaje para ti</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {packages.map((pkg) => (
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
      )}
    </div>
  );
}
