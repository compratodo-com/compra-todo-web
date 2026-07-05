import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET /api/ads?type=banner&page=home
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "banner";
    const page = searchParams.get("page") || "*";

    const now = new Date();

    const ads = await prisma.advertisement.findMany({
      where: {
        isActive: true,
        type,
        startsAt: { lte: now },
        endsAt: { gte: now },
        AND: [
          {
            OR: [
              { pages: { has: page } },
              { pages: { has: "*" } },
            ],
          },
        ],
      } as any,
      take: 1,
      orderBy: { createdAt: "desc" },
    });

    if (ads.length === 0) {
      return NextResponse.json({ ad: null });
    }

    const ad = ads[0];

    // Incrementar impresiones
    await prisma.advertisement.update({
      where: { id: ad.id },
      data: { currentImpressions: { increment: 1 } },
    });

    return NextResponse.json({
      ad: {
        id: ad.id,
        imageUrl: ad.imageUrl,
        linkUrl: ad.linkUrl,
        altText: ad.altText,
        width: ad.width,
        height: ad.height,
        type: ad.type,
        advertiser: ad.advertiser,
      },
    });
  } catch (error) {
    return NextResponse.json({ ad: null, error: "Error loading ad" });
  }
}

// POST /api/ads/click
export async function POST(req: Request) {
  try {
    const { adId } = await req.json();
    if (adId) {
      await prisma.advertisement.update({
        where: { id: adId },
        data: { currentClicks: { increment: 1 } },
      });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false });
  }
}
