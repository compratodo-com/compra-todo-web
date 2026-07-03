import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveMissions, completeMission } from "@/lib/game";

// GET /api/game/missions
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const missions = await getActiveMissions(session.user.id);
    return NextResponse.json({ missions });
  } catch (error) {
    console.error("[Missions] Error:", error);
    return NextResponse.json(
      { error: "Error al cargar misiones" },
      { status: 500 }
    );
  }
}

// POST /api/game/missions
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { missionId } = await req.json();
    const result = await completeMission(session.user.id, missionId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Complete Mission] Error:", error);
    return NextResponse.json(
      { error: "Error al completar misión" },
      { status: 500 }
    );
  }
}
