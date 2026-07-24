"use client";

// Using regular img tag for reliable external image loading
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    originalPrice: number | null;
    currency?: string;
    thumbnail: string | null;
    images: string[];
    discount: number;
    soldQuantity: number;
    tags: string[];
    categoryName?: string | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const displayPrice = product.price;
  const displayOriginalPrice = product.originalPrice;
  const displayDiscount = product.discount;
  const imageUrl = product.thumbnail || product.images[0] || "/placeholder.svg";
  const isTrending = product.tags?.includes("trending");
  const isViral = product.tags?.includes("viral");

  return (
    <Link href={`/catalog/${product.id}`} className="group">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-purple-200 transition-all duration-200">
        {/* Image */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <img
            src={imageUrl}
            alt={product.title}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
            {displayDiscount > 0 && (
              <div className="absolute top-2 left-2">
                <Badge variant="danger">
                  -{displayDiscount}%
                </Badge>
              </div>
            )}
          {isTrending && (
            <div className="absolute top-2 right-2">
              <Badge variant="warning">🔥 Popular</Badge>
            </div>
          )}
          {isViral && (
            <div className="absolute top-2 right-2">
              <Badge variant="purple">🔥 Viral</Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-xs text-gray-500 mb-1 truncate">
            {product.categoryName || "Sin categoría"}
          </p>
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem]">
            {product.title}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-purple-700">
                  {formatCurrency(displayPrice, product.currency)}
                </span>
                {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                  <span className="text-sm text-gray-400 line-through">
                    {formatCurrency(displayOriginalPrice, product.currency)}
                  </span>
                )}
          </div>
          {product.soldQuantity > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {product.soldQuantity.toLocaleString("es-CL")} vendidos
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({
  products,
  loading,
}: {
  products: ProductCardProps["product"][];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
            <div className="aspect-square bg-gray-100" />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-gray-100 rounded w-1/3" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
              <div className="h-5 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-6xl">📦</span>
        <h3 className="text-lg font-medium text-gray-900 mt-4">
          No encontramos productos
        </h3>
        <p className="text-gray-500 mt-2">
          Intenta con otra búsqueda o categoría
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
