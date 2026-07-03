"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias, email: email || undefined, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al registrarse");
      }

      router.push("/auth/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <span className="text-4xl">🎮</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            Crear cuenta
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Únete al simulador de compras más realista de Chile
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 block mb-1">
              Alias <span className="text-red-500">*</span>
            </label>
            <Input
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Tu nombre de usuario"
              required
              minLength={3}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">
              Email <span className="text-gray-400">(opcional)</span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="para recibir ofertas del juego"
            />
            <p className="text-xs text-gray-400 mt-1">
              Te enviaremos ofertas y actualizaciones de tus pedidos
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">
              Contraseña <span className="text-red-500">*</span>
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={loading}
          >
            Crear cuenta 🎉
          </Button>
        </form>

        <div className="mt-6 bg-purple-50 rounded-lg p-3">
          <p className="text-xs text-purple-700">
            🎁 <strong>Bono de bienvenida:</strong> 500 🪙 CompraCoins gratis al
            registrarte
          </p>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/auth/login"
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Iniciar sesión
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400 mt-4">
          Al registrarte aceptas que Compra-Todo es un simulador de compras con
          fines de entretenimiento.
        </p>
      </Card>
    </div>
  );
}
