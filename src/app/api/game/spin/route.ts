import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { addCoins, addXP, processDailyStreak, spinWheel } from "@/lib/game";

// POST /api/game/spin
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const { orderId, type = "standard" } = await req.json();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Check if user already spun for this order
    if (orderId) {
      const existingSpin = await prisma.spin.findUnique({
        where: { orderId },
      });
      if (existingSpin) {
        return NextResponse.json(
          { error: "Ya giraste la ruleta para este pedido" },
          { status: 409 }
        );
      }
    }

    const { prize, multiplier } = spinWheel(user.level);
    const rewardValue = prize.value ? prize.value * multiplier : 0;

    // Record the spin
    await prisma.spin.create({
      data: {
        userId,
        orderId: orderId || null,
        type,
        result: prize.type,
        rewardValue: rewardValue || null,
        multiplier,
      },
    });

    let result: Record<string, unknown> = {
      type: prize.type,
      label: prize.label,
      value: rewardValue,
      multiplier,
    };

    // Apply rewards
    if (prize.type === "coins" && rewardValue > 0) {
      await addCoins(
        userId,
        Math.floor(rewardValue),
        "earn_from_spin",
        `Ruleta: ${prize.label}`,
        orderId
      );
      result.newCoins = user.coins + Math.floor(rewardValue);
    }

    if (prize.type === "boost") {
      // Boost: award bonus coins directly
      const bonusCoins = Math.floor(rewardValue * 100);
      await addCoins(userId, bonusCoins, "earn_from_spin", `Boost: ${prize.label}`, orderId);
      result.newCoins = (result.newCoins as number || user.coins) + bonusCoins;
    }

    if (prize.type === "discount" && orderId) {
      // Apply discount to the order
      await prisma.order.update({
        where: { id: orderId },
        data: {
          discount: rewardValue,
          total: {
            // We'll recalculate on order fetch
          },
        },
      });
    }

    await addXP(userId, 25);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Spin] Error:", error);
    return NextResponse.json(
      { error: "Error al girar la ruleta" },
      { status: 500 }
    );
  }
}
