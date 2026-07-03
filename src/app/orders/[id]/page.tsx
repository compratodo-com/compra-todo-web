"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button, Skeleton } from "@/components/ui";
import { OrderTracker } from "@/components/orders/OrderTracker";

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchOrder, 30000);
    return () => clearInterval(interval);
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <span className="text-6xl">🔍</span>
        <h2 className="text-xl font-bold mt-4">Pedido no encontrado</h2>
        <Link href="/orders">
          <Button className="mt-4">Mis pedidos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/orders"
        className="text-sm text-gray-500 hover:text-purple-600 mb-6 inline-block"
      >
        ← Mis pedidos
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        📦 Pedido #{order.orderNumber}
      </h1>

      <OrderTracker order={order} />

      {/* Rewards */}
      {order.status === "delivered" && (
        <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 text-center">
          <span className="text-4xl">🎉</span>
          <h3 className="text-lg font-bold text-gray-900 mt-2">
            ¡Pedido entregado!
          </h3>
          <p className="text-yellow-700 font-medium mt-1">
            🪙 +{order.coinsEarned} CompraCoins
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Has ganado experiencia y monedas por esta compra simulada
          </p>
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <Link href="/catalog">
          <Button>Seguir comprando</Button>
        </Link>
        <Link href="/game">
          <Button variant="outline">🎮 Ir al juego</Button>
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-xs text-yellow-700">
          ⚠️ Seguimiento simulado — parte del juego Compra-Todo. Todos los
          eventos, ubicaciones y tiempos son simulados con fines de
          entretenimiento. Ningún producto real será despachado.
        </p>
      </div>
    </div>
  );
}
