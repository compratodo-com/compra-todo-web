import { NextResponse } from "next/server";

// Permitir hasta 60s: verificar imágenes con Groq toma varios segundos por producto.
export const maxDuration = 60;

// GET /api/cron/agents?key=SECRET&agent=curator
// Extra para image_hunter:
//   &dry=1      → simula sin escribir en la base (devuelve los cambios propuestos)
//   &max=N      → tope de productos a procesar en la corrida
//   &offset=N   → desde qué candidato empezar (para paginar en tandas)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const agent = searchParams.get("agent") || "all";
    const dry = searchParams.get("dry") === "1";
    const maxParam = searchParams.get("max");
    const offsetParam = searchParams.get("offset");

    // Validar clave secreta
    if (key !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { runAgent, runAllAgents } = await import("@/lib/agents/runner");

    let results;
    if (agent === "all") {
      results = await runAllAgents();
    } else {
      const opts: Record<string, unknown> = {};
      if (dry) opts.dryRun = true;
      if (maxParam && !isNaN(Number(maxParam))) opts.maxProducts = Number(maxParam);
      if (offsetParam && !isNaN(Number(offsetParam))) opts.offset = Number(offsetParam);
      results = await runAgent(agent, Object.keys(opts).length ? opts : undefined);
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
