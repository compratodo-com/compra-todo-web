"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button, Card, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        alias,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Alias o contraseña incorrectos");
      } else {
        router.push("/catalog");
        router.refresh();
      }
    } catch (err) {
      setError("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <span className="text-4xl">🛒</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            Iniciar sesión
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Ingresa a tu cuenta de Compra-Todo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 block mb-1">
              Alias
            </label>
            <Input
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Tu alias"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">
              Contraseña
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
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
            Ingresar
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿No tienes cuenta?{" "}
          <Link
            href="/auth/register"
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Registrarse
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400 mt-4">
          Al ingresar aceptas que esto es un simulador de compras con fines de
          entretenimiento.
        </p>
      </Card>
    </div>
  );
}
