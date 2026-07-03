import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { processDailyStreak } from "@/lib/game";

// POST /api/game/daily
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const result = await processDailyStreak(session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Daily] Error:", error);
    return NextResponse.json(
      { error: "Error al reclamar recompensa diaria" },
      { status: 500 }
    );
  }
}
