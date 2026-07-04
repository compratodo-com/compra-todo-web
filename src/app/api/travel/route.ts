import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET /api/travel?page=1&limit=20&region=Caribe&promotional=true
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const region = searchParams.get("region");
    const promotional = searchParams.get("promotional");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const currency = searchParams.get("currency") || "CLP";

    const where: Record<string, unknown> = { isActive: true };
    if (region) where.tags = { has: region };
    if (promotional === "true") where.promotional = true;

    const [packages, total] = await Promise.all([
      prisma.travelPackage.findMany({
        where: where as any,
        orderBy: [{ promotional: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.travelPackage.count({ where: where as any }),
    ]);

    return NextResponse.json({
      packages: packages.map((p) => ({
        ...p,
        price: p.price,
        originalPrice: p.originalPrice,
        currency,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al cargar viajes" }, { status: 500 });
  }
}
