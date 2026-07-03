"use client";

import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui";

interface OrderTrackerProps {
  order: {
    orderNumber: string;
    status: string;
    trackingCode: string | null;
    courier: string | null;
    estimatedDelivery: string | null;
    total: number;
    products: Array<{
      title: string;
      image: string;
      quantity: number;
    }>;
    events: Array<{
      status: string;
      title: string;
      description: string | null;
      location: string | null;
      isMilestone: boolean;
      createdAt: string;
    }>;
  };
}

const STATUS_ICONS: Record<string, string> = {
  confirmed: "✅",
  preparing: "📦",
  picked_up: "🚛",
  in_hub: "🏭",
  in_transit: "🚚",
  out_for_delivery: "🚚",
  delivered: "🎉",
  delayed: "⏳",
};

const STATUS_ORDER = [
  "confirmed",
  "preparing",
  "picked_up",
  "in_hub",
  "in_transit",
  "out_for_delivery",
  "delivered",
];

export function OrderTracker({ order }: OrderTrackerProps) {
  const currentIndex = STATUS_ORDER.indexOf(order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-500">Pedido #{order.orderNumber}</p>
          <Badge variant={order.status === "delivered" ? "success" : "purple"}>
            {STATUS_ICONS[order.status] || "📋"}{" "}
            {order.events.find((e) => e.status === order.status)?.title ||
              order.status}
          </Badge>
        </div>
        {order.trackingCode && (
          <p className="text-xs text-gray-400">
            Código de seguimiento: {order.trackingCode} · {order.courier}
          </p>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {order.events.map((event, index) => {
          const isCurrent = event.status === order.status;
          const isPast =
            STATUS_ORDER.indexOf(event.status) <= currentIndex ||
            event.status === "delayed";
          const isDelayed = event.status === "delayed";

          return (
            <div key={index} className="flex gap-4 pb-6 last:pb-0">
              {/* Line and dot */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    isPast
                      ? "bg-purple-600 text-white"
                      : isCurrent
                      ? "bg-purple-100 text-purple-600 border-2 border-purple-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isPast
                    ? "✓"
                    : STATUS_ICONS[event.status] || "○"}
                </div>
                {index < order.events.length - 1 && (
                  <div
                    className={`w-0.5 h-full ${
                      isPast ? "bg-purple-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p
                      className={`font-medium ${
                        isCurrent
                          ? "text-purple-700"
                          : isDelayed
                          ? "text-yellow-700"
                          : "text-gray-900"
                      }`}
                    >
                      {event.title}
                    </p>
                    {event.description && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        {event.description}
                      </p>
                    )}
                    {event.location && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        📍 {event.location}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 whitespace-nowrap ml-4">
                    {new Date(event.createdAt).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Products */}
      <div className="border-t pt-4">
        <p className="text-sm font-medium text-gray-700 mb-3">
          Productos en este pedido:
        </p>
        <div className="space-y-2">
          {order.products.map((product, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-gray-600 flex-1 truncate">
                {product.quantity}x {product.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-xs text-yellow-700">
          ⚠️ Seguimiento simulado — parte del juego Compra-Todo. Ningún producto
          real será despachado.
        </p>
      </div>
    </div>
  );
}
