#!/usr/bin/env node
// Daily Agent Scheduler
// Ejecución automatizada de agentes vía cron o manual.
// 
// Manual:
//   pnpm tsx scripts/run-agents.ts --all
//   pnpm tsx scripts/run-agents.ts --agent curator
// 
// Cron (cada 6 horas):
//   0 0,6,12,18 * * * cd /ruta && pnpm tsx scripts/run-agents.ts --all

import "dotenv/config";

async function main() {
  const args = process.argv.slice(2);
  const agentFlag = args.indexOf("--agent");
  const runAll = args.includes("--all");

  if (agentFlag >= 0 && args[agentFlag + 1]) {
    const agentName = args[agentFlag + 1];
    console.log(`[Scheduler] Running single agent: ${agentName}`);
    const { runAgent } = await import("@/lib/agents/runner");
    const result = await runAgent(agentName);
    console.log(`[Scheduler] Result:`, JSON.stringify(result, null, 2));
    return;
  }

  // ─── Run ALL agents in sequence ───

  console.log(`[Scheduler] ⏰ Starting daily agent run at ${new Date().toISOString()}`);
  console.log(`[Scheduler] ==========================================`);

  // 1. CATALOG CURATOR - Importa productos desde MercadoLibre con imágenes
  console.log(`\n[Scheduler] 🤖 Agent 1/6: Catalog Curator (importa tendencias)`);
  const { runAllAgents } = await import("@/lib/agents/runner");
  
  if (runAll) {
    const results = await runAllAgents();
    for (const r of results) {
      console.log(`  [${r.agent}] ${r.status}: ${r.action}`);
      if (r.details) {
        console.log(`    Details:`, JSON.stringify(r.details));
      }
    }
  } else {
    // Run specific agents in order
    const agentOrder = [
      "image_hunter",   // 0. Buscar imágenes reales
      "economist",      // 1. Ajustar monedas
      "curator",        // 2. Importar productos
      "trend_hunter",   // 2. Marcar tendencias
      "promoter",       // 3. Generar promociones
      "events_director", // 4. Gestionar eventos
      "mail_carrier",   // 5. Enviar correos
      "optimizer",      // 6. Optimizar
    ];

    for (const name of agentOrder) {
      try {
        console.log(`  → Running ${name}...`);
        const { runAgent } = await import("@/lib/agents/runner");
        const result = await runAgent(name);
        console.log(`  ✓ ${name}: ${result.status} — ${result.action}`);
        if (result.details) {
          console.log(`    ${JSON.stringify(result.details)}`);
        }
      } catch (error) {
        console.error(`  ✗ ${name} failed:`, error);
      }
    }
  }

  console.log(`\n[Scheduler] ==========================================`);
  console.log(`[Scheduler] ✅ Daily agent run completed at ${new Date().toISOString()}`);
}

main().catch((error) => {
  console.error("[Scheduler] ❌ Fatal error:", error);
  process.exit(1);
});
