"use client";

import Link from "next/link";
import { Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/components/currency/CurrencySelector";
import { convertPrice } from "@/lib/currency";

interface TravelCardProps {
  pkg: {
    id: string;
    title: string;
    slug: string;
    destination: string;
    price: number;
    originalPrice: number | null;
    thumbnail: string | null;
    images: string[];
    duration: string;
    includes: string[];
    rating: number | null;
    tags: string[];
    promotional: boolean;
    discountPct: number | null;
  };
  featured?: boolean;
}

export function TravelCard({ pkg, featured = false }: TravelCardProps) {
  const { currency } = useCurrency();
  const displayPrice = convertPrice(pkg.price, currency);
  const displayOriginalPrice = pkg.originalPrice ? convertPrice(pkg.originalPrice, currency) : null;
  const promoTag = pkg.tags.find(t => t.startsWith("🔥") || t.startsWith("⭐") || t.startsWith("🎉") || t.startsWith("💎") || t.startsWith("🌟") || t.startsWith("🏆"));

  return (
    <Link href={`/travel/${pkg.slug}`} className={`block group ${featured ? "col-span-2 md:col-span-2 lg:col-span-2" : ""}`}>
      <article className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-purple-200 transition-all duration-200 h-full">
        {/* Imagen */}
        <div className={`relative ${featured ? "aspect-[21/9]" : "aspect-[4/3]"} bg-gray-100 overflow-hidden`}>
          <img
            src={pkg.thumbnail || pkg.images[0] || ""}
            alt={pkg.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {pkg.promotional && promoTag && (
              <Badge variant="danger">{promoTag}</Badge>
            )}
            {pkg.discountPct && (
              <Badge variant="warning">-{pkg.discountPct}% OFF</Badge>
            )}
          </div>
          {pkg.rating && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xs font-medium">
              ⭐ {pkg.rating.toFixed(1)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
            <span>📍 {pkg.destination}</span>
            <span>·</span>
            <span>📅 {pkg.duration}</span>
          </div>
          <h3 className={`font-bold text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-2 mb-2 ${featured ? "text-xl" : "text-base"}`}>
            {pkg.title}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">
            {pkg.includes.slice(0, 3).join(" · ")}
          </p>
          <div className="flex items-baseline gap-2">
            <span className={`font-bold text-purple-700 ${featured ? "text-2xl" : "text-lg"}`}>
              {formatCurrency(displayPrice, currency)}
            </span>
            {displayOriginalPrice && displayOriginalPrice > displayPrice && (
              <span className="text-sm text-gray-400 line-through">
                {formatCurrency(displayOriginalPrice, currency)}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">por persona, impuestos incluidos</p>
        </div>
      </article>
    </Link>
  );
}
