import { prisma } from "@/lib/db/prisma";

export async function trackAnalyticsEvent(
  name: string,
  userId?: string,
  sessionId?: string,
  metadata?: Record<string, unknown>
) {
  try {
    await prisma.analyticEvent.create({
      data: {
        name,
        userId,
        sessionId,
        metadata: (metadata || {}) as any,
      },
    });
  } catch (error) {
    console.error("[Analytics] Error tracking event:", error);
  }
}

export async function getDashboardMetrics() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 3600000);

  const [
    totalUsers,
    todayUsers,
    activeWeekUsers,
    totalOrders,
    todayOrders,
    totalRevenue,
    totalSpins,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.spin.count(),
  ]);

  return {
    totalUsers,
    todayUsers,
    activeWeekUsers,
    totalOrders,
    todayOrders,
    totalRevenue: totalRevenue._sum.total || 0,
    totalSpins,
  };
}
