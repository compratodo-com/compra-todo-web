import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDashboardMetrics } from "@/lib/analytics";

// GET /api/analytics
export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const metrics = await getDashboardMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("[Analytics] Error:", error);
    return NextResponse.json(
      { error: "Error al cargar analytics" },
      { status: 500 }
    );
  }
}
