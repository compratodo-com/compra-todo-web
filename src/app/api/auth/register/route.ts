import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: Request) {
  try {
    const { alias, email, password } = await req.json();

    if (!alias || alias.length < 3) {
      return NextResponse.json(
        { error: "El alias debe tener al menos 3 caracteres" },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Check if alias already exists
    const existingAlias = await prisma.user.findUnique({ where: { alias } });
    if (existingAlias) {
      return NextResponse.json(
        { error: "Este alias ya está en uso" },
        { status: 409 }
      );
    }

    // Check email if provided
    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return NextResponse.json(
          { error: "Este email ya está registrado" },
          { status: 409 }
        );
      }
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        alias,
        email: email || null,
        passwordHash,
        coins: 500, // Bonus de bienvenida
        totalCoinsEarned: 500,
        emailPrefs: {
          create: {
            offers: true,
            events: true,
            tracking: true,
            weekly: true,
          },
        },
      },
    });

    // Create initial daily missions
    const missions = await prisma.mission.findMany({
      where: { type: "daily", isActive: true },
    });

    for (const mission of missions) {
      await prisma.userMission.create({
        data: {
          userId: user.id,
          missionId: mission.id,
          progress: 0,
          completed: false,
        },
      });
    }

    return NextResponse.json(
      {
        id: user.id,
        alias: user.alias,
        email: user.email,
        coins: user.coins,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Register] Error:", error);
    return NextResponse.json(
      { error: "Error al registrar usuario" },
      { status: 500 }
    );
  }
}
