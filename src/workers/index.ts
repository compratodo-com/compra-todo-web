/**
 * Worker entry point - starts all background workers.
 * In production, each worker would be a separate process managed by PM2 or similar.
 *
 * Usage: npx tsx src/workers/index.ts
 */

import { startTrackingSimulator } from "./tracking-simulator";

async function main() {
  console.log("🚀 Starting Compra-Todo Workers...");

  // Start tracking simulator (updates order statuses)
  await startTrackingSimulator(60000); // Check every 60 seconds in dev

  console.log("✅ Workers started");
}

main().catch(console.error);
