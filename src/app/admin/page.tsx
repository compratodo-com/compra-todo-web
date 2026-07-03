"use client";

import { useState, useEffect } from "react";
import { Button, Card, Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "agents" | "logs">("dashboard");
  const [metrics, setMetrics] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentResult, setAgentResult] = useState<any>(null);

  useEffect(() => {
    fetchMetrics();
    fetchLogs();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/agents/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const runAgent = async (agent: string) => {
    setAgentResult({ running: true });
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent }),
      });
      const data = await res.json();
      setAgentResult(data.result);
      fetchLogs();
    } catch (error) {
      setAgentResult({ error: String(error) });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        ⚙️ Panel de Administración
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {(["dashboard", "agents", "logs"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab === "dashboard"
              ? "📊 Dashboard"
              : tab === "agents"
              ? "🤖 Agentes"
              : "📋 Logs"}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Usuarios totales", value: metrics?.totalUsers || 0, icon: "👥" },
              { label: "Hoy", value: metrics?.todayUsers || 0, icon: "📅" },
              { label: "Pedidos totales", value: metrics?.totalOrders || 0, icon: "📦" },
              { label: "Giros ruleta", value: metrics?.totalSpins || 0, icon: "🎡" },
            ].map((item) => (
              <Card key={item.label} className="p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {item.value.toLocaleString("es-CL")}
                    </p>
                    <p className="text-xs text-gray-500">{item.label}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              🪙 Economía del juego
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Ingreso total simulado</p>
                <p className="text-xl font-bold text-purple-700">
                  ${(metrics?.totalRevenue || 0).toLocaleString("es-CL")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Usuarios activos (7d)</p>
                <p className="text-xl font-bold text-gray-900">
                  {metrics?.activeWeekUsers || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "agents" && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Los agentes autónomos mantienen el sitio actualizado sin
            intervención manual.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {[
              { id: "curator", name: "Curador", desc: "Actualiza catálogo cada 6h", icon: "📦" },
              { id: "trend_hunter", name: "Tendencias", desc: "Detecta productos virales", icon: "🔥" },
              { id: "promoter", name: "Promociones", desc: "Genera ofertas y descuentos", icon: "🏷️" },
              { id: "events_director", name: "Eventos", desc: "Programa eventos semanales", icon: "📅" },
              { id: "mail_carrier", name: "Cartero", desc: "Envía correos CRM", icon: "✉️" },
              { id: "optimizer", name: "Optimizador", desc: "Analiza métricas y ajusta", icon: "📊" },
            ].map((agent) => (
              <Card key={agent.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{agent.icon}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">{agent.name}</h3>
                      <p className="text-sm text-gray-500">{agent.desc}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => runAgent(agent.id)}
                    loading={agentResult?.running}
                  >
                    Ejecutar
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {agentResult && !agentResult.running && (
            <Card className="p-4 bg-green-50 border-green-200">
              <p className="text-sm text-green-700">
                ✅ Agente ejecutado: {JSON.stringify(agentResult)}
              </p>
            </Card>
          )}

          <Button
            onClick={() => runAgent("all")}
            loading={agentResult?.running}
            className="w-full"
          >
            🤖 Ejecutar todos los agentes
          </Button>
        </div>
      )}

      {activeTab === "logs" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">
              Últimas ejecuciones de agentes
            </p>
            <Button size="sm" variant="outline" onClick={fetchLogs}>
              Actualizar
            </Button>
          </div>

          <div className="space-y-2">
            {logs.map((log: any) => (
              <Card key={log.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
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
                    <span className="font-medium text-sm">{log.agent}</span>
                    <span className="text-sm text-gray-500">
                      {log.action}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDate(log.createdAt)}
                  </span>
                </div>
                {log.details && (
                  <pre className="mt-2 text-xs text-gray-500 bg-gray-50 rounded p-2 overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </Card>
            ))}
            {logs.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-8">
                No hay logs de agentes aún
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
