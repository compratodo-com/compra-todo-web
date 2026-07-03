"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { Button, Card, Badge } from "@/components/ui";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const statusBadge: Record<string, { variant: "success" | "warning" | "purple" | "default"; label: string }> = {
    confirmed: { variant: "default", label: "✅ Confirmado" },
    preparing: { variant: "warning", label: "📦 Preparando" },
    picked_up: { variant: "purple", label: "🚛 En camino" },
    in_hub: { variant: "purple", label: "🏭 En CD" },
    in_transit: { variant: "purple", label: "🚚 En tránsito" },
    out_for_delivery: { variant: "purple", label: "🚚 En reparto" },
    delivered: { variant: "success", label: "🎉 Entregado" },
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        📦 Mis pedidos
      </h1>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
            </Card>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card className="p-12 text-center">
          <span className="text-6xl">📦</span>
          <h2 className="text-xl font-semibold text-gray-900 mt-4">
            No tienes pedidos aún
          </h2>
          <p className="text-gray-500 mt-2">
            Tus compras simuladas aparecerán aquí
          </p>
          <Link href="/catalog">
            <Button className="mt-6">Ir de compras</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900">
                    #{order.orderNumber}
                  </p>
                  <Badge
                    variant={
                      statusBadge[order.status]?.variant || "default"
                    }
                  >
                    {statusBadge[order.status]?.label || order.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {order.products?.slice(0, 3).map((p: any) => (
                      <div
                        key={p.id}
                        className="w-8 h-8 bg-gray-100 rounded overflow-hidden"
                      >
                        <img
                          src={p.image}
                          alt=""
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ))}
                    {(order.products?.length || 0) > 3 && (
                      <span className="text-gray-400 text-xs">
                        +{order.products.length - 3}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-purple-700">
                      {formatCurrency(order.total)}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {formatRelativeTime(order.createdAt)}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
