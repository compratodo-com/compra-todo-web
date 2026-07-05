import { prisma } from "@/lib/db/prisma";
import { Button, Card } from "@/components/ui";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Media Kit — Publicidad en Compra-Todo",
  description: "Llega a miles de usuarios amantes de las compras y el estilo de vida. Espacios publicitarios disponibles en una de las plataformas de experiencia de compra más innovadoras de Latinoamérica.",
  path: "/media-kit",
});

export default async function MediaKitPage() {
  const [totalUsers, totalOrders, totalSpins, articles, travelPkgs] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.spin.count(),
    prisma.article.count({ where: { publishedAt: { not: null } } }),
    prisma.travelPackage.count({ where: { isActive: true } }),
  ]);

  const trafficEstimate = totalUsers * 3; // Estimación conservadora

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          📊 Media Kit
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Conecta tu marca con miles de usuarios que disfrutan la mejor experiencia de compra en línea. 
          Compra-Todo es el lugar ideal para mostrar tus productos a una audiencia comprometida y en 
          modo de compra.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { value: `${(trafficEstimate / 1000).toFixed(0)}K+`, label: "Visitas/mes", icon: "👥" },
          { value: totalOrders.toString(), label: "Compras simuladas", icon: "🛒" },
          { value: `${totalSpins.toLocaleString("es-CL")}`, label: "Interacciones", icon: "🎡" },
          { value: `${articles + travelPkgs}`, label: "Contenidos", icon: "📰" },
        ].map((stat) => (
          <Card key={stat.label} className="p-6 text-center">
            <span className="text-3xl block mb-2">{stat.icon}</span>
            <p className="text-2xl font-bold text-purple-700">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Ad Slots */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📐 Espacios publicitarios disponibles</h2>

        <div className="space-y-6">
          {[
            { name: "Leaderboard", slot: "leaderboard", size: "728×90px", desc: "Banner superior en todas las páginas. Alta visibilidad.", price: "Desde $150.000 CLP/mes", img: "📋" },
            { name: "Sidebar", slot: "sidebar", size: "300×250px", desc: "Rectángulo en páginas de catálogo y artículos.", price: "Desde $100.000 CLP/mes", img: "📐" },
            { name: "In-Content", slot: "banner", size: "728×90px", desc: " Banner entre productos y artículos.", price: "Desde $120.000 CLP/mes", img: "📄" },
            { name: "Sponsored Article", slot: "sponsored", size: "Full", desc: "Artículo patrocinado en nuestro Magazine.", price: "Desde $200.000 CLP/mes", img: "✍️" },
            { name: "Email Marketing", slot: "email", size: "Newsletter", desc: "Inclusión en nuestro newsletter semanal.", price: "Desde $80.000 CLP/mes", img: "📧" },
            { name: "Travel Featured", slot: "travel", size: "Destacado", desc: "Paquete turístico destacado como patrocinado.", price: "Desde $250.000 CLP/mes", img: "🧳" },
          ].map((ad) => (
            <Card key={ad.name} className="p-6 flex items-start gap-4">
              <span className="text-3xl">{ad.img}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{ad.name}</h3>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">{ad.size}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{ad.desc}</p>
                <p className="text-sm font-bold text-purple-700 mt-2">{ad.price}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Audience */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🎯 Nuestra audiencia</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Perfil del usuario</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✅ Hombres y mujeres 18-45 años</li>
              <li>✅ Interesados en tecnología, moda, viajes y lifestyle</li>
              <li>✅ Usuarios en modo de compra (alta intención)</li>
              <li>✅ Latinoamérica: Chile, México, Argentina, Colombia, Perú</li>
              <li>✅ Multi-moneda: Precios en CLP, MXN, ARS, COP, PEN, USD</li>
            </ul>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Beneficios</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✅ Usuarios en modo de compra = alta conversión</li>
              <li>✅ Segmentación por categoría de producto</li>
              <li>✅ Reportes mensuales de impresiones y clicks</li>
              <li>✅ Precios competitivos en CLP</li>
              <li>✅ Posicionamiento como marca innovadora</li>
            </ul>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-8 md:p-12 text-center text-white">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">📩 ¿Quieres anunciarte con nosotros?</h2>
        <p className="text-purple-100 mb-6 max-w-xl mx-auto">
          Escríbenos para recibir nuestro media kit completo con precios actualizados, 
          casos de éxito y disponibilidad de espacios.
        </p>
        <div className="text-lg font-medium">
          <a href="mailto:publicidad@compra-todo.com" className="inline-flex items-center gap-2 bg-white text-purple-700 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors">
            ✉️ publicidad@compra-todo.com
          </a>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-xs text-yellow-700">
          Las métricas mostradas son estimaciones basadas en datos actuales de la plataforma. 
          Los precios son referenciales y pueden variar según disponibilidad y duración de la campaña.
        </p>
      </div>
    </div>
  );
}
