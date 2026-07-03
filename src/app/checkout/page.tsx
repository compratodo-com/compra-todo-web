"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Button, Card, Input } from "@/components/ui";
import { Roulette } from "@/components/game/Roulette";
import Link from "next/link";

interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

interface RouletteResult {
  type: string;
  label: string;
  value: number | null;
  multiplier: number;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<CartItem[]>([]);
  const [step, setStep] = useState<"review" | "spin" | "done">("review");
  const [confirming, setConfirming] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [spinResult, setSpinResult] = useState<RouletteResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check for direct buy params
    const directProduct = searchParams.get("product");
    const directQty = parseInt(searchParams.get("qty") || "1");

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    if (directProduct) {
      // Fetch product and create single item
      fetch(`/api/catalog/${directProduct}`)
        .then((r) => r.json())
        .then((product) => {
          setItems([
            {
              productId: product.id,
              title: product.title,
              price: product.price,
              quantity: directQty,
              image: product.thumbnail || product.images?.[0] || "",
            },
          ]);
        });
    } else {
      setItems(cart);
    }
  }, [searchParams]);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = spinResult?.type === "discount" ? (spinResult.value || 0) / 100 : 0;
  const total = subtotal * (1 - discount);

  const handleSpin = (result: RouletteResult) => {
    setSpinResult(result);
  };

  const handleCheckout = async () => {
    setConfirming(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear pedido");
      }

      const data = await res.json();
      setOrderResult(data.order);

      // Clear cart
      localStorage.setItem("cart", JSON.stringify([]));
      window.dispatchEvent(new Event("cartUpdated"));

      setStep("done");
    } catch (err: any) {
      setError(err.message);
      setStep("spin");
    } finally {
      setConfirming(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-6xl">🛒</span>
        <h2 className="text-xl font-semibold mt-4">No hay productos</h2>
        <Link href="/catalog">
          <Button className="mt-4">Ir al catálogo</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {step === "review" && (
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="font-semibold text-lg mb-4">Resumen del pedido</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.productId} className="p-3 flex gap-3">
                  <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.quantity} x {formatCurrency(item.price)}
                    </p>
                    <p className="text-sm font-bold text-purple-700 mt-1">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <Card className="p-6">
              <h2 className="font-semibold text-lg mb-4">
                Completa tu compra
              </h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Alias o email
                  </label>
                  <Input placeholder="Tu alias registrado" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Comuna de entrega
                  </label>
                  <Input placeholder="Ej: Ñuñoa, Santiago" />
                </div>
              </div>

              <div className="border-t pt-4 space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span>Total simulado</span>
                  <span className="text-purple-700 text-lg">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={() => setStep("spin")}
              >
                🎡 Girar ruleta y pagar
              </Button>

              <p className="text-xs text-gray-400 text-center mt-3">
                No se usará dinero real
              </p>
            </Card>
          </div>
        </div>
      )}

      {step === "spin" && (
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2">
            🎡 ¡Gira la ruleta!
          </h2>
          <p className="text-gray-500 mb-8">
            Gira antes de confirmar tu compra y gana premios
          </p>

          <Roulette onSpin={handleSpin} level={1} />

          <div className="flex gap-3 mt-8 justify-center">
            <Button variant="outline" onClick={() => setStep("review")}>
              Volver
            </Button>
            <Button onClick={handleCheckout} loading={confirming}>
              ✅ Confirmar compra simulada
            </Button>
          </div>

          {error && (
            <p className="text-red-500 text-sm mt-4">{error}</p>
          )}
        </div>
      )}

      {step === "done" && orderResult && (
        <div className="max-w-lg mx-auto text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Compra simulada exitosa!
          </h2>
          <p className="text-gray-500 mb-6">
            Recibirás notificaciones y correos con el seguimiento de tu pedido.
          </p>

          <Card className="p-6 mb-6">
            <div className="space-y-3 text-left">
              <div className="flex justify-between">
                <span className="text-gray-500">Pedido</span>
                <span className="font-medium">{orderResult.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estado</span>
                <span className="text-green-600 font-medium">✅ Confirmado</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total simulado</span>
                <span className="font-bold text-purple-700">
                  {formatCurrency(orderResult.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">🪙 Coins ganados</span>
                <span className="font-bold text-yellow-600">
                  +{orderResult.coinsEarned}
                </span>
              </div>
              {orderResult.trackingCode && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Código tracking</span>
                  <span className="font-mono text-sm">
                    {orderResult.trackingCode}
                  </span>
                </div>
              )}
            </div>
          </Card>

          <div className="flex gap-3 justify-center">
            <Link href={`/orders/${orderResult.id}`}>
              <Button>📦 Ver seguimiento</Button>
            </Link>
            <Link href="/catalog">
              <Button variant="outline">Seguir comprando</Button>
            </Link>
          </div>

          <div className="mt-6 bg-yellow-50 rounded-lg p-4">
            <p className="text-xs text-yellow-700">
              ⚠️ Esto fue una compra simulada como parte del juego Compra-Todo.
              Ningún producto real será despachado.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default function CheckoutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">🛒 Checkout</h1>
      <Suspense fallback={
        <div className="text-center py-16">
          <div className="animate-spin text-4xl">🛒</div>
          <p className="mt-4 text-gray-500">Cargando...</p>
        </div>
      }>
        <CheckoutContent />
      </Suspense>
    </div>
  );
}
