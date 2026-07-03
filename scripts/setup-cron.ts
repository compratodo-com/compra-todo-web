#!/usr/bin/env node
/**
 * Crontab Setup Helper
 * 
 * Instala las tareas programadas para los agentes autónomos:
 * - Catálogo: se actualiza cada 6 horas
 * - Tendencias: diario
 * - Promociones: diario
 * - Tracking: cada 5 minutos
 * 
 * Ejecutar: pnpm tsx scripts/setup-cron.ts
 */

import { execSync } from "child_process";
import path from "path";

const PROJECT_PATH = process.cwd();
const TSX_PATH = path.join(PROJECT_PATH, "node_modules", ".bin", "tsx");
const AGENTS_SCRIPT = path.join(PROJECT_PATH, "scripts", "run-agents.ts");

const CRON_ENTRIES = [
  // Cada 6 horas - importar productos y actualizar catálogo
  `0 */6 * * * cd ${PROJECT_PATH} && ${TSX_PATH} ${AGENTS_SCRIPT} --agent curator >> /tmp/compra-todo-curator.log 2>&1`,
  
  // Cada 12 horas - importación masiva de tops
  `0 */12 * * * cd ${PROJECT_PATH} && ${TSX_PATH} ${AGENTS_SCRIPT} --agent product_importer >> /tmp/compra-todo-importer.log 2>&1`,
  
  // Diario a las 8:00 - tendencias
  `0 8 * * * cd ${PROJECT_PATH} && ${TSX_PATH} ${AGENTS_SCRIPT} --agent trend_hunter >> /tmp/compra-todo-trends.log 2>&1`,
  
  // Diario a las 9:00 - promociones
  `0 9 * * * cd ${PROJECT_PATH} && ${TSX_PATH} ${AGENTS_SCRIPT} --agent promoter >> /tmp/compra-todo-promos.log 2>&1`,
  
  // Diario a las 11:00 - correos
  `0 11 * * * cd ${PROJECT_PATH} && ${TSX_PATH} ${AGENTS_SCRIPT} --agent mail_carrier >> /tmp/compra-todo-email.log 2>&1`,
  
  // Semanal (domingo) - optimización
  `0 12 * * 0 cd ${PROJECT_PATH} && ${TSX_PATH} ${AGENTS_SCRIPT} --agent optimizer >> /tmp/compra-todo-optimizer.log 2>&1`,
];

function main() {
  console.log("📋 Compra-Todo — Crontab Setup");
  console.log("================================");
  console.log(`Project: ${PROJECT_PATH}`);
  console.log(`\nThis will add the following cron entries:\n`);

  for (const entry of CRON_ENTRIES) {
    console.log(`  ${entry}`);
  }

  console.log(`\nTo install manually, run:`);
  console.log(`  crontab -e`);
  console.log(`\nAnd paste the entries above.`);
  console.log(`\nOr use this one-liner to append:`);
  console.log(`  (crontab -l 2>/dev/null; echo "${CRON_ENTRIES.join('\\n')}") | crontab -`);
}

main();
