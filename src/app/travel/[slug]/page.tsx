import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button, Badge, Card } from "@/components/ui";
import { buildMetadata } from "@/lib/seo";
import { formatCurrency } from "@/lib/utils";
import type { Metadata } from "next";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await prisma.travelPackage.findUnique({ where: { slug } });
  if (!pkg) return buildMetadata({ title: "Paquete no encontrado" });
  return buildMetadata({
    title: `${pkg.title} | Compra-Todo Viajes`,
    description: pkg.description.slice(0, 160),
    path: `/travel/${pkg.slug}`,
    image: pkg.thumbnail || undefined,
  });
}

export default async function TravelDetailPage({ params }: Props) {
  const { slug } = await params;
  const pkg = await prisma.travelPackage.findUnique({ where: { slug } });
  if (!pkg) notFound();

  const related = await prisma.travelPackage.findMany({
    where: { isActive: true, id: { not: pkg.id }, tags: { hasSome: pkg.tags.filter(t => !t.startsWith("🔥") && !t.startsWith("⭐")) } },
    take: 4,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-purple-600">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/travel" className="hover:text-purple-600">Viajes</Link>
        <span className="mx-2">/</span>
        <span>{pkg.title.slice(0, 40)}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Imágenes */}
        <div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-3">
            <img src={pkg.thumbnail || pkg.images[0] || ""} alt={pkg.title} className="w-full h-full object-cover" />
            {pkg.discountPct && (
              <div className="absolute top-4 left-4"><Badge variant="danger">-{pkg.discountPct}% OFF</Badge></div>
            )}
          </div>
          {pkg.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {pkg.images.map((img, i) => (
                <div key={i} className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-transparent hover:border-purple-600">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Información */}
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <span>📍 {pkg.destination}</span>
            <span>·</span>
            <span>📅 {pkg.duration}</span>
            {pkg.rating && <span>· ⭐ {pkg.rating.toFixed(1)}</span>}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{pkg.title}</h1>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-purple-700">{formatCurrency(pkg.price)}</span>
            {pkg.originalPrice && pkg.originalPrice > pkg.price && (
              <span className="text-lg text-gray-400 line-through">{formatCurrency(pkg.originalPrice)}</span>
            )}
            <span className="text-sm text-gray-400">por persona</span>
          </div>

          {/* Incluye */}
          <Card className="p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">✅ Incluye</h3>
            <ul className="space-y-2">
              {pkg.includes.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> {item}
                </li>
              ))}
            </ul>
          </Card>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {pkg.tags.filter(t => !t.startsWith("🔥") && !t.startsWith("⭐") && !t.startsWith("🎉") && !t.startsWith("💎")).map((tag, i) => (
              <Badge key={i} variant="purple">{tag}</Badge>
            ))}
          </div>

          {/* Descripción */}
          <div className="prose prose-sm mb-8">
            <p className="text-gray-600 leading-relaxed">{pkg.description}</p>
          </div>

          {/* Acción */}
          <Link href={`/travel/${pkg.slug}/book`}>
            <Button size="lg" className="w-full">🧳 Reservar esta experiencia</Button>
          </Link>
          <p className="text-xs text-gray-400 text-center mt-2">Reserva simulada — parte de la experiencia Compra-Todo</p>
        </div>
      </div>

      {/* Relacionados */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold text-gray-900 mb-6">🌍 Otros destinos que te pueden interesar</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((r) => (
              <Link key={r.id} href={`/travel/${r.slug}`} className="group">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                  <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                    <img src={r.thumbnail || r.images[0] || ""} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-400">📍 {r.destination}</p>
                    <p className="font-medium text-gray-900 text-sm line-clamp-2 mt-1">{r.title}</p>
                    <p className="text-purple-700 font-bold text-sm mt-1">{formatCurrency(r.price)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-xs text-yellow-700">Los precios y paquetes mostrados son referenciales del mercado turístico y forman parte de la experiencia de compra simulada de Compra-Todo. No se realizarán reservas reales.</p>
      </div>
    </div>
  );
}
