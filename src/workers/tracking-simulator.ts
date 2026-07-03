/**
 * Tracking Simulator
 * Schedules and processes order tracking updates in the background.
 * In production, this runs on BullMQ workers.
 */

import { prisma } from "@/lib/db/prisma";
import { advanceOrderStatus } from "@/lib/orders";

export async function processTrackingUpdates() {
  const activeOrders = await prisma.order.findMany({
    where: {
      status: { notIn: ["delivered", "cancelled"] },
    },
    include: {
      events: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  let updated = 0;
  for (const order of activeOrders) {
    const result = await advanceOrderStatus(order.id);
    if (result && result.status !== order.status) {
      updated++;
    }
  }

  return { checked: activeOrders.length, updated };
}

// Run this function periodically (every 5 minutes in production)
export async function startTrackingSimulator(intervalMs = 300000) {
  console.log("[TrackingSimulator] Started");

  const run = async () => {
    try {
      const result = await processTrackingUpdates();
      if (result.updated > 0) {
        console.log(`[TrackingSimulator] Updated ${result.updated} orders`);
      }
    } catch (error) {
      console.error("[TrackingSimulator] Error:", error);
    }
  };

  // Run immediately then on interval
  await run();
  setInterval(run, intervalMs);
}
