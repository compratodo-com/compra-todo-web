import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET /api/articles?category=xxx&featured=true&page=1&limit=10
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);

    const where: Record<string, unknown> = { publishedAt: { not: null } };
    if (category) where.category = category;
    if (featured === "true") where.featured = true;

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where: where as any,
        orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          imageUrl: true,
          category: true,
          tags: true,
          featured: true,
          publishedAt: true,
        },
      }),
      prisma.article.count({ where: where as any }),
    ]);

    return NextResponse.json({
      articles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al cargar artículos" }, { status: 500 });
  }
}
