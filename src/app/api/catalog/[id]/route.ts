import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { convertPrice } from "@/lib/currency";

// GET /api/catalog/[id]?currency=CLP
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const currency = searchParams.get("currency") || "CLP";
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        prices: {
          orderBy: { recordedAt: "desc" },
          take: 10,
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Get related products (same category)
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

    return NextResponse.json({
      ...product,
      price: convertPrice(product.price, currency),
      originalPrice: product.originalPrice ? convertPrice(product.originalPrice, currency) : null,
      currency, // override CLP from DB with user's selected currency
      discount: product.originalPrice
        ? Math.round(((convertPrice(product.originalPrice, currency) - convertPrice(product.price, currency)) / convertPrice(product.originalPrice, currency)) * 100)
        : 0,
      related: related.map((p) => {
        const rPrice = convertPrice(p.price, currency);
        const rOrigPrice = p.originalPrice ? convertPrice(p.originalPrice, currency) : null;
        return {
          ...p,
          price: rPrice,
          originalPrice: rOrigPrice,
          currency,
          discount: rOrigPrice
            ? Math.round(((rOrigPrice - rPrice) / rOrigPrice) * 100)
            : 0,
        };
      }),
    });
  } catch (error) {
    console.error("[Product] Error:", error);
    return NextResponse.json(
      { error: "Error al cargar producto" },
      { status: 500 }
    );
  }
}
