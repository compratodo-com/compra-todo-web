#!/usr/bin/env node
/**
 * Agent Worker System
 *
 * Run: npx tsx src/workers/agent-worker.ts
 * This script runs the autonomous agents on schedule.
 * In production, use a cron job or BullMQ scheduler.
 */

import { runAgent, runAllAgents } from "@/lib/agents/runner";

const AGENT_SCHEDULES: Record<string, string> = {
  curator: "0 */6 * * *",       // Every 6 hours
  trend_hunter: "0 8 * * *",    // Daily at 8 AM
  promoter: "0 9 * * *",        // Daily at 9 AM
  events_director: "0 10 * * 1", // Weekly on Monday
  mail_carrier: "0 11 * * *",   // Daily at 11 AM
  optimizer: "0 12 * * 0",     // Weekly on Sunday
};

async function main() {
  const args = process.argv.slice(2);
  const agentName = args[0];

  console.log(`[AgentWorker] Starting...`);

  if (agentName && agentName !== "all") {
    if (!AGENT_SCHEDULES[agentName]) {
      console.error(`[AgentWorker] Unknown agent: ${agentName}`);
      console.log(`Available agents: ${Object.keys(AGENT_SCHEDULES).join(", ")}`);
      process.exit(1);
    }
    console.log(`[AgentWorker] Running agent: ${agentName}`);
    const result = await runAgent(agentName);
    console.log(`[AgentWorker] Result:`, JSON.stringify(result, null, 2));
  } else {
    console.log(`[AgentWorker] Running all agents...`);
    const results = await runAllAgents();
    for (const result of results) {
      console.log(`[${result.agent}] ${result.status}: ${result.action}`);
    }
  }

  console.log(`[AgentWorker] Done.`);
}

main().catch(console.error);
