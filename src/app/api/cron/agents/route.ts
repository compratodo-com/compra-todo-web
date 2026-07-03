import { NextResponse } from "next/server";

// GET /api/cron/agents?key=SECRET&agent=curator
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const agent = searchParams.get("agent") || "all";

    // Validar clave secreta
    if (key !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { runAgent, runAllAgents } = await import("@/lib/agents/runner");

    let results;
    if (agent === "all") {
      results = await runAllAgents();
    } else {
      results = await runAgent(agent);
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("[Cron Agents] Error:", error);
    return NextResponse.json(
      { error: "Error ejecutando agentes" },
      { status: 500 }
    );
  }
}
