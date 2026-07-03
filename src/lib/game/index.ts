import { prisma } from "@/lib/db/prisma";
import { getLevelInfo } from "@/lib/utils";

export async function addCoins(
  userId: string,
  amount: number,
  type: string,
  description: string,
  referenceId?: string
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      coins: { increment: amount },
      totalCoinsEarned: { increment: Math.max(0, amount) },
    },
  });

  await prisma.transaction.create({
    data: {
      userId,
      type,
      amount,
      balance: user.coins,
      description,
      referenceId,
    },
  });

  return user;
}

export async function spendCoins(
  userId: string,
  amount: number,
  type: string,
  description: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.coins < amount) {
    throw new Error("CompraCoins insuficientes");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { coins: { decrement: amount } },
  });

  await prisma.transaction.create({
    data: {
      userId,
      type,
      amount: -amount,
      balance: updated.coins,
      description,
    },
  });

  return updated;
}

export async function addXP(userId: string, xpAmount: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Usuario no encontrado");

  let newXp = user.xp + xpAmount;
  let newLevel = user.level;
  let leveledUp = false;

  // Check for level up
  while (newXp >= getXPForLevel(newLevel)) {
    newXp -= getXPForLevel(newLevel);
    newLevel++;
    leveledUp = true;
  }

  if (leveledUp) {
    await prisma.user.update({
      where: { id: userId },
      data: { xp: newXp, level: newLevel },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { xp: newXp },
    });
  }

  return { newLevel, newXp, leveledUp };
}

function getXPForLevel(level: number): number {
  return level * 500 + (level - 1) * 250;
}

export async function updateTotalSpent(userId: string, amount: number) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { totalSpent: { increment: amount } },
  });

  return getLevelInfo(user.totalSpent);
}

export async function processDailyStreak(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Usuario no encontrado");

  const now = new Date();
  const lastDaily = user.lastDaily;
  let newStreak = 1;

  if (lastDaily) {
    const hoursSince = (now.getTime() - lastDaily.getTime()) / 3600000;
    if (hoursSince < 24) {
      // Already claimed today
      return { streak: user.streak, alreadyClaimed: true };
    }
    if (hoursSince < 48) {
      newStreak = user.streak + 1;
    }
    // else: streak resets to 1
  }

  const streakReward = Math.min(newStreak * 10, 200);

  await prisma.user.update({
    where: { id: userId },
    data: {
      streak: newStreak,
      lastDaily: now,
      coins: { increment: streakReward },
      totalCoinsEarned: { increment: streakReward },
    },
  });

  await prisma.transaction.create({
    data: {
      userId,
      type: "earn_from_streak",
      amount: streakReward,
      balance: user.coins + streakReward,
      description: `Racha de ${newStreak} día(s)`,
    },
  });

  return { streak: newStreak, reward: streakReward, alreadyClaimed: false };
}

export async function getActiveMissions(userId: string) {
  const missions = await prisma.mission.findMany({
    where: {
      isActive: true,
      OR: [
        { type: "daily" },
        { type: "weekly" },
        { type: "achievement" },
        {
          type: "seasonal",
          seasonStart: { lte: new Date() },
          seasonEnd: { gte: new Date() },
        },
      ],
    },
  });

  const userMissions = await prisma.userMission.findMany({
    where: { userId },
  });

  return missions.map((mission) => {
    const um = userMissions.find((um) => um.missionId === mission.id);
    return {
      ...mission,
      progress: um?.progress || 0,
      completed: um?.completed || false,
      completedAt: um?.completedAt || null,
    };
  });
}

export async function completeMission(userId: string, missionId: string) {
  const mission = await prisma.mission.findUnique({ where: { id: missionId } });
  if (!mission) throw new Error("Misión no encontrada");

  const userMission = await prisma.userMission.findUnique({
    where: { userId_missionId: { userId, missionId } },
  });

  if (userMission?.completed) {
    return { alreadyCompleted: true };
  }

  await prisma.userMission.upsert({
    where: { userId_missionId: { userId, missionId } },
    update: {
      completed: true,
      completedAt: new Date(),
      progress: mission.targetCount,
    },
    create: {
      userId,
      missionId,
      completed: true,
      completedAt: new Date(),
      progress: mission.targetCount,
    },
  });

  await addCoins(userId, mission.rewardCoins, "earn_from_mission", `Misión completada: ${mission.title}`, missionId);
  await addXP(userId, mission.rewardXp);

  return { alreadyCompleted: false, rewardCoins: mission.rewardCoins, rewardXp: mission.rewardXp };
}

export async function updateMissionProgress(userId: string, requirement: string, count = 1) {
  const missions = await prisma.mission.findMany({
    where: {
      isActive: true,
      requirement,
    },
  });

  for (const mission of missions) {
    const um = await prisma.userMission.upsert({
      where: { userId_missionId: { userId, missionId: mission.id } },
      update: {
        progress: { increment: count },
      },
      create: {
        userId,
        missionId: mission.id,
        progress: count,
      },
    });

    if (!um.completed && um.progress >= mission.targetCount) {
      await completeMission(userId, mission.id);
    }
  }
}

export const SPIN_PRIZES = {
  standard: [
    { type: "coins", label: "50 🪙", value: 50, weight: 30 },
    { type: "coins", label: "100 🪙", value: 100, weight: 20 },
    { type: "coins", label: "200 🪙", value: 200, weight: 10 },
    { type: "discount", label: "5% OFF", value: 5, weight: 15 },
    { type: "discount", label: "10% OFF", value: 10, weight: 10 },
    { type: "discount", label: "20% OFF", value: 20, weight: 5 },
    { type: "boost", label: "x2 Coins 24h", value: 2, weight: 5 },
    { type: "nothing", label: "Sigue participando", value: 0, weight: 5 },
  ],
  improved: [
    { type: "coins", label: "100 🪙", value: 100, weight: 25 },
    { type: "coins", label: "250 🪙", value: 250, weight: 20 },
    { type: "coins", label: "500 🪙", value: 500, weight: 10 },
    { type: "discount", label: "10% OFF", value: 10, weight: 15 },
    { type: "discount", label: "20% OFF", value: 20, weight: 10 },
    { type: "discount", label: "30% OFF", value: 30, weight: 5 },
    { type: "boost", label: "x3 Coins 48h", value: 3, weight: 3 },
    { type: "nothing", label: "Sigue participando", value: 0, weight: 2 },
  ],
  golden: [
    { type: "coins", label: "500 🪙", value: 500, weight: 20 },
    { type: "coins", label: "1000 🪙", value: 1000, weight: 15 },
    { type: "coins", label: "2500 🪙", value: 2500, weight: 5 },
    { type: "discount", label: "20% OFF", value: 20, weight: 15 },
    { type: "discount", label: "40% OFF", value: 40, weight: 10 },
    { type: "discount", label: "50% OFF", value: 50, weight: 5 },
    { type: "boost", label: "x5 Coins 72h", value: 5, weight: 3 },
    { type: "nothing", label: "Sigue participando", value: 0, weight: 2 },
  ],
};

export function spinWheel(level: number): { prize: (typeof SPIN_PRIZES.standard)[0]; multiplier: number } {
  let pool;
  if (level >= 5) pool = SPIN_PRIZES.golden;
  else if (level >= 2) pool = SPIN_PRIZES.improved;
  else pool = SPIN_PRIZES.standard;

  const totalWeight = pool.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;

  for (const prize of pool) {
    random -= prize.weight;
    if (random <= 0) {
      return { prize, multiplier: level >= 5 ? 2 : level >= 3 ? 1.5 : 1 };
    }
  }

  return { prize: pool[0], multiplier: 1 };
}
