"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Button, Card, Badge } from "@/components/ui";

interface GameState {
  coins: number;
  totalCoinsEarned: number;
  level: number;
  title: string;
  xp: number;
  totalSpent: number;
  streak: number;
  progress: number;
  nextLevel: string | null;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    createdAt: string;
  }>;
}

export default function GamePage() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyResult, setDailyResult] = useState<{
    streak: number;
    reward: number;
    alreadyClaimed: boolean;
  } | null>(null);

  useEffect(() => {
    fetchGameState();
    fetchMissions();
  }, []);

  const fetchGameState = async () => {
    try {
      const res = await fetch("/api/game/state");
      if (res.ok) {
        const data = await res.json();
        setGameState(data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMissions = async () => {
    try {
      const res = await fetch("/api/game/missions");
      if (res.ok) {
        const data = await res.json();
        setMissions(data.missions || []);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const claimDaily = async () => {
    try {
      const res = await fetch("/api/game/daily", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setDailyResult(data);
        if (!data.alreadyClaimed) {
          fetchGameState();
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-32 bg-gray-200 rounded-xl" />
          <div className="h-48 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🎮 Mi juego</h1>
        <Link href="/auth/login">
          <Button variant="outline">Conectar cuenta</Button>
        </Link>
      </div>

      {/* Level Card */}
      <Card className="p-6 mb-6 bg-gradient-to-br from-purple-600 to-indigo-700 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-200 text-sm">NIVEL {gameState?.level || 1}</p>
            <h2 className="text-2xl font-bold">{gameState?.title || "Novato"}</h2>
            <p className="text-purple-200 text-sm mt-1">
              🪙 {gameState?.coins || 0} CompraCoins
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{gameState?.level || 1}</p>
            <p className="text-purple-200 text-xs">Nivel</p>
          </div>
        </div>
        {/* XP Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-purple-200 mb-1">
            <span>Progreso</span>
            <span>{Math.round(gameState?.progress || 0)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-yellow-400 h-2 rounded-full transition-all"
              style={{ width: `${gameState?.progress || 0}%` }}
            />
          </div>
          {gameState?.nextLevel && (
            <p className="text-xs text-purple-200 mt-1">
              Siguiente nivel: {gameState.nextLevel}
            </p>
          )}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Streak */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            🔥 Racha diaria
          </h3>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl">🔥</span>
            <div>
              <p className="text-2xl font-bold">{gameState?.streak || 0} días</p>
              <p className="text-sm text-gray-500">
                ¡No pierdas tu racha!
              </p>
            </div>
          </div>
          <Button onClick={claimDaily} className="w-full" size="sm">
            {dailyResult?.alreadyClaimed
              ? "✓ Reclamado hoy"
              : "🎁 Reclamar recompensa"}
          </Button>
          {dailyResult && !dailyResult.alreadyClaimed && (
            <p className="text-green-600 text-sm mt-2 text-center">
              🪙 +{dailyResult.reward} CompraCoins
            </p>
          )}
        </Card>

        {/* Stats */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            📊 Estadísticas
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total gastado (simulado)</span>
              <span className="font-medium">
                {formatCurrency(gameState?.totalSpent || 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">🪙 Total coins ganados</span>
              <span className="font-medium">
                {gameState?.totalCoinsEarned || 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">⚡ XP total</span>
              <span className="font-medium">{gameState?.xp || 0}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Missions */}
      <section className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          🎯 Misiones
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {missions.map((mission) => (
            <Card key={mission.id} className="p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{mission.icon || "🎯"}</span>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {mission.title}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {mission.description}
                      </p>
                    </div>
                    {mission.completed && (
                      <Badge variant="success">Completada</Badge>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>
                        {mission.progress}/{mission.targetCount}
                      </span>
                      <span>+{mission.rewardCoins} 🪙</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          mission.completed ? "bg-green-500" : "bg-purple-600"
                        }`}
                        style={{
                          width: `${Math.min(
                            (mission.progress / mission.targetCount) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {missions.length === 0 && (
            <p className="text-gray-500 text-sm col-span-2 text-center py-8">
              No hay misiones activas por ahora
            </p>
          )}
        </div>
      </section>

      {/* Transactions */}
      {gameState?.transactions && gameState.transactions.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📋 Últimas transacciones
          </h2>
          <Card>
            <div className="divide-y">
              {gameState.transactions.slice(0, 10).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 text-sm"
                >
                  <div>
                    <p className="text-gray-900">{tx.description}</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(tx.createdAt).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                  <span
                    className={`font-medium ${
                      tx.amount > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount} 🪙
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
