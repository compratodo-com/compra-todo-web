import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { convertPrice } from "@/lib/currency";
import { notFound } from "next/navigation";
import ProductDetailClient from "./product-client";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    return { title: "Producto no encontrado - Compra-Todo" };
  }

  return {
    title: product.title,
    description:
      product.description?.slice(0, 160) ||
      `${product.title} en Compra-Todo — Simulador de compras`,
    openGraph: {
      title: product.title,
      description: product.description?.slice(0, 160),
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!product) notFound();

  // Related products (same category)
  const related = product.categoryId
    ? await prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          id: { not: product.id },
          isActive: true,
        },
        take: 8,
        orderBy: { soldQuantity: "desc" },
      })
    : [];

  // Moneda default para SSR (CLP). Si el usuario tiene otra moneda,
  // el client component hará un re-fetch ligero al hidratar.
  const currency = "CLP";

  // Serializamos a objeto plano para pasar al cliente
  const enrich = (price: number, originalPrice: number | null) => ({
    price: convertPrice(price, currency),
    originalPrice: originalPrice ? convertPrice(originalPrice, currency) : null,
    discount: originalPrice
      ? Math.round(
          ((convertPrice(originalPrice, currency) - convertPrice(price, currency)) /
            convertPrice(originalPrice, currency)) *
            100
        )
      : 0,
  });

  const e = enrich(product.price, product.originalPrice);

  const initialProduct = {
    id: product.id,
    title: product.title,
    description: product.description,
    price: e.price,
    originalPrice: e.originalPrice,
    currency,
    discount: e.discount,
    images: product.images,
    thumbnail: product.thumbnail,
    brand: product.brand,
    soldQuantity: product.soldQuantity,
    tags: product.tags,
    categoryName: product.category?.name ?? null,
    related: related.map((p) => {
      const r = enrich(p.price, p.originalPrice);
      return {
        id: p.id,
        title: p.title,
        price: r.price,
        originalPrice: r.originalPrice,
        thumbnail: p.thumbnail,
        images: p.images,
        discount: r.discount,
        soldQuantity: p.soldQuantity,
        tags: p.tags,
      };
    }),
  };

  return <ProductDetailClient initialProduct={initialProduct} />;
}
