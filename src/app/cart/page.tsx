"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Button, Card } from "@/components/ui";
// Using regular img tag for reliable external image loading

interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setItems(cart);
    setLoaded(true);
  }, []);

  const updateQuantity = (productId: string, delta: number) => {
    const newItems = items
      .map((item) => {
        if (item.productId === productId) {
          const qty = item.quantity + delta;
          return qty <= 0 ? null : { ...item, quantity: qty };
        }
        return item;
      })
      .filter(Boolean) as CartItem[];

    setItems(newItems);
    localStorage.setItem("cart", JSON.stringify(newItems));
  };

  const removeItem = (productId: string) => {
    const newItems = items.filter((item) => item.productId !== productId);
    setItems(newItems);
    localStorage.setItem("cart", JSON.stringify(newItems));
  };

  const clearCart = () => {
    setItems([]);
    localStorage.setItem("cart", JSON.stringify([]));
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!loaded) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">🛒 Carrito</h1>

      {items.length === 0 ? (
        <Card className="p-12 text-center">
          <span className="text-6xl">🛒</span>
          <h2 className="text-xl font-semibold text-gray-900 mt-4">
            Tu carrito está vacío
          </h2>
          <p className="text-gray-500 mt-2">
            Agrega productos desde el catálogo para empezar a comprar
          </p>
          <Link href="/catalog">
            <Button className="mt-6">Ir al catálogo</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {/* Items */}
          <div className="md:col-span-2 space-y-3">
            {items.map((item) => (
              <Card key={item.productId} className="p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/catalog/${item.productId}`}
                      className="text-sm font-medium text-gray-900 hover:text-purple-600 line-clamp-2"
                    >
                      {item.title}
                    </Link>
                    <p className="text-purple-700 font-bold mt-1">
                      {formatCurrency(item.price)}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-gray-300 rounded-lg text-sm">
                        <button
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="px-3 py-1.5 hover:bg-gray-50 min-w-[32px]"
                        >
                          -
                        </button>
                        <span className="px-4 py-1.5 font-medium min-w-[32px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="px-3 py-1.5 hover:bg-gray-50 min-w-[32px]"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-sm text-red-500 hover:text-red-600 py-1.5 px-2"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}

            <button
              onClick={clearCart}
              className="text-sm text-gray-500 hover:text-red-500"
            >
              Vaciar carrito
            </button>
          </div>

          {/* Summary */}
          <div>
            <Card className="p-6 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">
                Resumen
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Envío</span>
                  <span>Simulado 🚚</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-purple-700">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              </div>

              <Link href="/checkout">
                <Button size="lg" className="w-full mt-6">
                  🎡 Ir a pagar (simulado)
                </Button>
              </Link>

              <Link
                href="/catalog"
                className="block text-center text-sm text-gray-500 hover:text-purple-600 mt-4"
              >
                Seguir comprando
              </Link>

              <div className="mt-4 bg-yellow-50 rounded-lg p-3">
                <p className="text-xs text-yellow-700">
                  ⚠️ Esta es una compra simulada. No se usará dinero real ni se
                  despacharán productos físicos.
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
