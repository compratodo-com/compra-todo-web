import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { processDailyStreak } from "@/lib/game";

// GET /api/game/state
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const levels = [
      { level: 1, title: "Novato", minSpent: 0 },
      { level: 2, title: "Cazaofertas", minSpent: 300000 },
      { level: 3, title: "Comprador Pro", minSpent: 1500000 },
      { level: 4, title: "Maestro del Carrito", minSpent: 5000000 },
      { level: 5, title: "Leyenda Compra-Todo", minSpent: 15000000 },
    ];

    let currentLevel = levels[0];
    for (let i = levels.length - 1; i >= 0; i--) {
      if (user.totalSpent >= levels[i].minSpent) {
        currentLevel = levels[i];
        break;
      }
    }

    const nextLevel = levels.find((l) => l.level === currentLevel.level + 1) || null;
    const progress = nextLevel
      ? ((user.totalSpent - currentLevel.minSpent) / (nextLevel.minSpent - currentLevel.minSpent)) * 100
      : 100;

    return NextResponse.json({
      coins: user.coins,
      totalCoinsEarned: user.totalCoinsEarned,
      level: currentLevel.level,
      title: currentLevel.title,
      xp: user.xp,
      totalSpent: user.totalSpent,
      streak: user.streak,
      progress: Math.min(progress, 100),
      nextLevel: nextLevel?.title || null,
      transactions: user.transactions,
    });
  } catch (error) {
    console.error("[Game State] Error:", error);
    return NextResponse.json(
      { error: "Error al cargar estado del juego" },
      { status: 500 }
    );
  }
}
