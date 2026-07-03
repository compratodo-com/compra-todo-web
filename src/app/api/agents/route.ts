import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { runAgent, runAllAgents } from "@/lib/agents/runner";

// POST /api/agents/run
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { agent } = await req.json();

    let result;
    if (agent && agent !== "all") {
      result = await runAgent(agent);
    } else {
      result = await runAllAgents();
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("[Agents] Error:", error);
    return NextResponse.json(
      { error: "Error al ejecutar agentes" },
      { status: 500 }
    );
  }
}

// GET /api/agents/logs
export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const logs = await prisma.agentLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("[Agent Logs] Error:", error);
    return NextResponse.json(
      { error: "Error al cargar logs" },
      { status: 500 }
    );
  }
}
