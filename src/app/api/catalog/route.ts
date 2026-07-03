import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { convertPrice } from "@/lib/currency";

// GET /api/catalog?category=xxx&search=xxx&sort=xxx&page=1&limit=20&currency=CLP
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "popular";
    const currency = searchParams.get("currency") || "CLP";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const tag = searchParams.get("tag");

    const where: Record<string, unknown> = { isActive: true };
    if (category) where.categoryId = category;
    if (tag) where.tags = { has: tag };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
      ];
    }

    let orderBy: Record<string, string> = { soldQuantity: "desc" };
    if (sort === "price_asc") orderBy = { price: "asc" };
    if (sort === "price_desc") orderBy = { price: "desc" };
    if (sort === "newest") orderBy = { createdAt: "desc" };
    if (sort === "name") orderBy = { title: "asc" };

    const [products, total, categories] = await Promise.all([
      prisma.product.findMany({
        where: where as any,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: { select: { name: true, slug: true } } },
      }),
      prisma.product.count({ where: where as any }),
      prisma.category.findMany({
        where: { isActive: true, parentId: null },
        orderBy: { order: "asc" },
      }),
    ]);

    return NextResponse.json({
      products: products.map((p) => {
        const price = convertPrice(p.price, currency);
        const originalPrice = p.originalPrice ? convertPrice(p.originalPrice, currency) : null;
        return {
          ...p,
          price,
          originalPrice,
          currency,
          discount: originalPrice
            ? Math.round(((originalPrice - price) / originalPrice) * 100)
            : 0,
          categoryName: p.category?.name || null,
        };
      }),
      categories,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[Catalog] Error:", error);
    return NextResponse.json(
      { error: "Error al cargar catálogo" },
      { status: 500 }
    );
  }
}
