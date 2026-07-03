"use client";

import { useState, useEffect } from "react";
import { Button, Card, Badge } from "@/components/ui";

export default function AgentsStatusPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [siteUrl, setSiteUrl] = useState("");

  useEffect(() => {
    setSiteUrl(window.location.origin);
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/agents/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const runAgent = async (agent: string) => {
    setRunning(agent);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent }),
      });
      if (res.ok) {
        fetchLogs();
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setRunning(null);
    }
  };

  const agentMeta: Record<string, { name: string; icon: string; schedule: string; color: string }> = {
    curator: { name: "Curador", icon: "📦", schedule: "Cada 6h", color: "purple" },
    economist: { name: "Economista", icon: "🧮", schedule: "Cada 24h", color: "blue" },
    trend_hunter: { name: "Cazador Tendencias", icon: "🔥", schedule: "Cada 24h", color: "orange" },
    promoter: { name: "Generador Promos", icon: "🏷️", schedule: "Cada 24h", color: "green" },
    mail_carrier: { name: "Cartero", icon: "✉️", schedule: "Cada 24h", color: "yellow" },
    optimizer: { name: "Optimizador", icon: "📊", schedule: "Semanal", color: "pink" },
  };

  const lastRunByAgent = (agent: string) => {
    const agentLogs = logs.filter((l) => l.agent === agent);
    if (agentLogs.length === 0) return null;
    return agentLogs[0];
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🤖 Estado de Agentes</h1>
          <p className="text-gray-500 mt-1">
            Monitoreo en vivo de los agentes autónomos
          </p>
        </div>
        <Button onClick={fetchLogs} variant="outline" size="sm">
          ↻ Actualizar
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-sm text-green-600 font-medium">Sitio</p>
          <p className="text-lg font-bold text-green-700">🟢 Online</p>
          <a href={siteUrl} className="text-xs text-green-500 underline" target="_blank">
            {siteUrl}
          </a>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 font-medium">Agentes activos</p>
          <p className="text-lg font-bold">{Object.keys(agentMeta).length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 font-medium">Última ejecución</p>
          <p className="text-lg font-bold">
            {logs.length > 0
              ? new Date(logs[0].createdAt).toLocaleString("es-CL")
              : "Nunca"}
          </p>
        </Card>
      </div>

      {/* Agent Cards */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {Object.entries(agentMeta).map(([id, meta]) => {
          const lastRun = lastRunByAgent(id);
          const isRunning = running === id;
          const hoursSinceLastRun = lastRun
            ? Math.floor(
                (Date.now() - new Date(lastRun.createdAt).getTime()) / 3600000
              )
            : null;

          return (
            <Card key={id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{meta.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{meta.name}</h3>
                    <p className="text-xs text-gray-400">{meta.schedule}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => runAgent(id)}
                  loading={isRunning}
                >
                  Ejecutar
                </Button>
              </div>

              {lastRun ? (
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        lastRun.status === "success"
                          ? "success"
                          : lastRun.status === "error"
                          ? "danger"
                          : "warning"
                      }
                    >
                      {lastRun.status}
                    </Badge>
                    <span className="text-gray-500">{lastRun.action}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {hoursSinceLastRun !== null && (
                      <>
                        Hace {hoursSinceLastRun}h —{" "}
                        {new Date(lastRun.createdAt).toLocaleString("es-CL")}
                      </>
                    )}
                  </p>
                  {lastRun.details && (
                    <pre className="text-xs text-gray-500 bg-gray-50 rounded p-2 mt-2 overflow-x-auto max-h-20">
                      {JSON.stringify(lastRun.details, null, 2)}
                    </pre>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  Nunca ejecutado
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card className="p-4">
        <h2 className="font-semibold text-gray-900 mb-4">
          📋 Actividad reciente de todos los agentes
        </h2>
        {logs.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">
            No hay actividad aún. Los agentes empezarán a ejecutarse automáticamente con los cron jobs.
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 text-sm p-2 hover:bg-gray-50 rounded-lg"
              >
                <Badge
                  variant={
                    log.status === "success"
                      ? "success"
                      : log.status === "error"
                      ? "danger"
                      : "warning"
                  }
                >
                  {log.status}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{log.agent}</p>
                  <p className="text-gray-500 truncate">{log.action}</p>
                </div>
                <p className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString("es-CL")}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Cron Info */}
      <Card className="p-4 mt-4 bg-purple-50 border-purple-200">
        <h2 className="font-semibold text-purple-900 mb-2">
          ⏰ Automatización activa
        </h2>
        <div className="text-sm text-purple-700 space-y-1">
          <p>📦 <strong>Curador:</strong> Cada 6 horas → renueva catálogo</p>
          <p>🧮 <strong>Economista:</strong> Cada 24h → ajusta precios por país</p>
          <p>📦 <strong>Tracking:</strong> Cada 5 min → avanza pedidos</p>
          <p className="mt-2 text-purple-500 text-xs">
            Para verificar que los cron jobs están activos en Vercel,
            ve a Settings → Cron Jobs en tu dashboard de Vercel.
          </p>
        </div>
      </Card>
    </div>
  );
}
