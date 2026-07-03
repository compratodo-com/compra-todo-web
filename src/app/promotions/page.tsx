"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { Button, Card, Badge } from "@/components/ui";
import { ProductGrid } from "@/components/catalog/ProductCard";

export default function PromotionsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      // Get products with discounts
      const res = await fetch("/api/catalog?sort=price_asc&limit=20");
      const data = await res.json();
      const withDiscounts = (data.products || []).filter((p: any) => p.discount > 0);
      setProducts(withDiscounts);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-2xl p-8 mb-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🔥</span>
          <Badge variant="default" className="bg-white/20 text-white">
            JUEGO
          </Badge>
        </div>
        <h1 className="text-3xl font-bold mb-2">Ofertas del juego</h1>
        <p className="text-white/80">
          Descuentos simulados para tus compras en Compra-Todo. Los precios de
          referencia son los reales del mercado.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
        <p className="text-sm text-yellow-700">
          ⚠️ Las ofertas y descuentos son beneficios del juego Compra-Todo. Los
          precios de lista son referenciales del mercado real. Ninguna oferta es
          emitida por las marcas o retailers mostrados.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-64" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <div className="text-center py-12">
          <span className="text-6xl">🏷️</span>
          <h3 className="text-lg font-medium mt-4">No hay ofertas activas</h3>
          <p className="text-gray-500">Vuelve pronto, los agentes generan ofertas nuevas cada día</p>
        </div>
      )}
    </div>
  );
}
