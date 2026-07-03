"use client";

import { useState, useEffect } from "react";
import { Button, Card, Input, Badge } from "@/components/ui";

export default function AdminConfigPage() {
  const [appId, setAppId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Load current config (from environment via an endpoint)
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then((data) => {
        if (data.appId) setAppId(data.appId);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setStatus("saving");
    setMessage("");

    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          MERCADO_LIBRE_APP_ID: appId,
          MERCADO_LIBRE_CLIENT_SECRET: clientSecret,
        }),
      });

      if (res.ok) {
        setStatus("saved");
        setMessage("Configuración guardada. Los agentes usarán MercadoLibre API en el próximo ciclo.");
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        ⚙️ Configuración de Agentes
      </h1>

      {/* ML API Config */}
      <Card className="p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🔌</span>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              MercadoLibre API
            </h2>
            <p className="text-sm text-gray-500">
              Conecta el catálogo con productos reales desde MercadoLibre Chile
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm text-gray-600 block mb-1">
              App ID (Client ID)
            </label>
            <Input
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="Tu App ID de MercadoLibre"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">
              Client Secret
            </label>
            <Input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Tu Client Secret"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} loading={status === "saving"}>
            {status === "saved" ? "✓ Guardado" : "Guardar configuración"}
          </Button>
          <a
            href="https://developers.mercadolibre.cl/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            ¿Cómo obtener credenciales? →
          </a>
        </div>

        {message && (
          <p
            className={`mt-3 text-sm ${
              status === "error" ? "text-red-600" : "text-green-600"
            }`}
          >
            {message}
          </p>
        )}
      </Card>

      {/* Current Status */}
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          📡 Estado de la conexión
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">MercadoLibre API</span>
            {appId ? (
              <Badge variant="success">Configurada</Badge>
            ) : (
              <Badge variant="warning">No configurada</Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Fuente activa</span>
            {appId ? (
              <span className="text-sm font-medium text-green-600">
                MercadoLibre (productos reales)
              </span>
            ) : (
              <span className="text-sm font-medium text-yellow-600">
                Catálogo sintético (hasta configurar ML)
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Imágenes</span>
            <span className="text-sm font-medium">Descarga local automática</span>
          </div>
        </div>
      </Card>

      {/* How to get ML credentials */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          📋 ¿Cómo obtener credenciales de MercadoLibre?
        </h2>
        <ol className="space-y-3 text-sm text-gray-600 list-decimal list-inside">
          <li>
            Ve a{" "}
            <a
              href="https://developers.mercadolibre.cl/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700"
            >
              developers.mercadolibre.cl
            </a>{" "}
            e inicia sesión con tu cuenta de MercadoLibre
          </li>
          <li>
            Crea una nueva aplicación en "Mis aplicaciones"
          </li>
          <li>
            Copia el <strong>App ID</strong> y <strong>Client Secret</strong>
          </li>
          <li>
            Pégalos aquí y los agentes empezarán a importar productos reales
            automáticamente
          </li>
        </ol>
        <div className="mt-4 bg-purple-50 rounded-lg p-3">
          <p className="text-xs text-purple-700">
            💡 <strong>Sin credenciales:</strong> El sistema genera un catálogo
            sintético con productos realistas que rota cada 6 horas. El sitio
            funciona completo desde el día uno.
          </p>
        </div>
      </Card>
    </div>
  );
}
