"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Button, Card, Input, Badge } from "@/components/ui";
import { Roulette } from "@/components/game/Roulette";
import {
  SHIPPING_METHODS,
  generateRandomCoupon,
  maybeGetSurpriseGift,
  getRelatedPromotions,
  type ShippingMethod,
  type Coupon,
  type SurpriseGift,
  type PackPromotion,
} from "@/lib/game/checkout-experience";
import Link from "next/link";

interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<CartItem[]>([]);
  const [step, setStep] = useState<"review" | "shipping" | "coupons" | "spin" | "done">("review");
  const [confirming, setConfirming] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>(SHIPPING_METHODS[0]);
  const [earnedCoupon, setEarnedCoupon] = useState<Coupon | null>(null);
  const [savedCoupons, setSavedCoupons] = useState<Coupon[]>([]);
  const [surpriseGift, setSurpriseGift] = useState<SurpriseGift | null>(null);
  const [relatedPacks] = useState<PackPromotion[]>(getRelatedPromotions());

  useEffect(() => {
    const directProduct = searchParams.get("product");
    const directQty = parseInt(searchParams.get("qty") || "1");
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    if (directProduct) {
      fetch(`/api/catalog/${directProduct}`)
        .then((r) => r.json())
        .then((product) => {
          setItems([
            { productId: product.id, title: product.title, price: product.price, quantity: directQty, image: product.thumbnail || product.images?.[0] || "" },
          ]);
        });
    } else {
      setItems(cart);
    }

    // Cargar cupones guardados
    const saved = JSON.parse(localStorage.getItem("compra-todo-coupons") || "[]");
    setSavedCoupons(saved);
  }, [searchParams]);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalWithShipping = subtotal + shippingMethod.price;

  const handleProceedToShipping = () => setStep("shipping");
  const handleProceedToCoupons = () => {
    // Generar cupón al llegar a esta etapa
    const newCoupon = generateRandomCoupon();
    setEarnedCoupon(newCoupon);
    // 10% de probabilidad de regalo sorpresa
    const gift = maybeGetSurpriseGift();
    setSurpriseGift(gift);
    setStep("coupons");
  };

  const saveCoupon = () => {
    if (!earnedCoupon) return;
    const updated = [...savedCoupons, earnedCoupon];
    setSavedCoupons(updated);
    localStorage.setItem("compra-todo-coupons", JSON.stringify(updated));
    setEarnedCoupon(null);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-6xl">🛒</span>
        <h2 className="text-xl font-semibold mt-4">No hay productos</h2>
        <Link href="/catalog"><Button className="mt-4">Ir al catálogo</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Progress bar */}
      <div className="flex items-center justify-center gap-2 mb-8 text-sm">
        {["review", "shipping", "coupons", "spin"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step === s ? "bg-purple-600 text-white" : 
              ["done"].includes(step) && ["review", "shipping", "coupons", "spin"].indexOf(s) <= ["review", "shipping", "coupons", "spin"].indexOf(step) ? "bg-green-500 text-white" :
              "bg-gray-200 text-gray-500"
            }`}>
              {i + 1}
            </div>
            <span className={`hidden sm:inline ${step === s ? "text-purple-700 font-medium" : "text-gray-400"}`}>
              {s === "review" ? "Revisar" : s === "shipping" ? "Envío" : s === "coupons" ? "Ofertas" : "Pagar"}
            </span>
            {i < 3 && <div className="w-8 h-0.5 bg-gray-200" />}
          </div>
        ))}
      </div>

      {step === "review" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center">🛒 Revisa tu pedido</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.productId} className="p-3 flex gap-3">
                  <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.quantity} x {formatCurrency(item.price)}</p>
                    <p className="text-sm font-bold text-purple-700 mt-1">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="space-y-4">
              {/* Related packs */}
              {relatedPacks.length > 0 && (
                <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                  <h3 className="font-semibold text-gray-900 mb-2">🔥 Ahorra más con packs</h3>
                  {relatedPacks.map((pack, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-purple-700 mb-1">
                      <span>{pack.icon}</span>
                      <span>{pack.name} — <strong>{pack.discount}% OFF</strong></span>
                    </div>
                  ))}
                </Card>
              )}

              {/* Coupons saved */}
              {savedCoupons.length > 0 && (
                <Card className="p-3 bg-yellow-50 border-yellow-200">
                  <p className="text-sm font-medium text-yellow-700">🎫 Tienes {savedCoupons.length} cupones guardados</p>
                </Card>
              )}

              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Resumen</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between text-gray-500"><span>Envío</span><span className="text-purple-600 font-medium">Por elegir</span></div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total</span><span className="text-purple-700">{formatCurrency(subtotal)}</span>
                  </div>
                </div>
                <Button size="lg" className="w-full mt-4" onClick={handleProceedToShipping}>
                  🚚 Elegir envío
                </Button>
              </Card>
            </div>
          </div>
        </div>
      )}

      {step === "shipping" && (
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">🚚 ¿Cómo quieres recibirlo?</h2>
          <p className="text-gray-500 text-center mb-6">Elige el método de envío que más te guste</p>

          <div className="space-y-3 mb-8">
            {SHIPPING_METHODS.map((method) => (
              <button
                key={method.id}
                onClick={() => setShippingMethod(method)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  shippingMethod.id === method.id
                    ? "border-purple-600 bg-purple-50 shadow-md"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{method.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{method.name}</p>
                      {method.price === 0 && <Badge variant="success">GRATIS</Badge>}
                    </div>
                    <p className="text-sm text-gray-500">{method.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-700">{method.price === 0 ? "Gratis" : formatCurrency(method.price)}</p>
                    <p className="text-xs text-gray-400">
                      {method.hours < 1 ? `${method.hours * 60} min` : `${method.hours} hrs`}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setStep("review")}>Volver</Button>
            <Button onClick={handleProceedToCoupons}>🎫 Ver ofertas →</Button>
          </div>
        </div>
      )}

      {step === "coupons" && (
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2">🎉 ¡Antes de pagar!</h2>
          <p className="text-gray-500 mb-8">Has ganado ofertas especiales en esta compra</p>

          {/* Surprise gift (10% probability) */}
          {surpriseGift && (
            <Card className="p-6 mb-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300 animate-bounce-in">
              <span className="text-5xl block mb-3">🎁</span>
              <Badge variant="warning">¡REGALO SORPRESA!</Badge>
              <h3 className="text-xl font-bold text-gray-900 mt-2">{surpriseGift.icon} {surpriseGift.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{surpriseGift.description}</p>
            </Card>
          )}

          {/* Coupon earned */}
          {earnedCoupon && (
            <Card className="p-6 mb-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <span className="text-4xl block mb-2">{earnedCoupon.icon}</span>
              <Badge variant="purple">{earnedCoupon.label}</Badge>
              <h3 className="text-lg font-bold text-gray-900 mt-2">{earnedCoupon.description}</h3>
              <p className="text-xs text-gray-400 mt-1 font-mono bg-gray-100 px-2 py-1 rounded inline-block">{earnedCoupon.code}</p>
              <div className="flex gap-2 mt-4 justify-center">
                <Button size="sm" onClick={saveCoupon}>💾 Guardar cupón</Button>
                <Button size="sm" variant="ghost" onClick={() => setEarnedCoupon(null)}>No gracias</Button>
              </div>
            </Card>
          )}

          <div className="flex gap-3 justify-center mt-6">
            <Button variant="outline" onClick={() => setStep("shipping")}>Volver</Button>
            <Button onClick={() => setStep("spin")}>
              🎡 Ir a pagar
            </Button>
          </div>
        </div>
      )}

      {step === "spin" && (
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2">🎡 ¡Gira la ruleta!</h2>
          <p className="text-gray-500 mb-8">Gira para ganar descuentos y premios antes de confirmar</p>

          <div className="mb-4 bg-purple-50 rounded-xl p-3">
            <p className="text-sm text-purple-700">
              🚚 <strong>{shippingMethod.icon} {shippingMethod.name}</strong>
            </p>
          </div>

          <Roulette onSpin={() => {}} level={1} />

          <div className="flex gap-3 mt-8 justify-center">
            <Button variant="outline" onClick={() => setStep("coupons")}>Volver</Button>
            <Button onClick={async () => {
              setConfirming(true);
              try {
                const res = await fetch("/api/orders", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ items: items.map(i => ({ productId: i.productId, quantity: i.quantity })) }),
                });
                if (!res.ok) throw new Error((await res.json()).error || "Error");
                const data = await res.json();
                setOrderResult(data.order);
                localStorage.setItem("cart", JSON.stringify([]));
                window.dispatchEvent(new Event("cartUpdated"));
                setStep("done");
              } catch (err: any) {
                setError(err.message);
              } finally { setConfirming(false); }
            }} loading={confirming}>
              ✅ Confirmar compra
            </Button>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        </div>
      )}

      {step === "done" && orderResult && (
        <div className="max-w-lg mx-auto text-center">
          <span className="text-6xl block mb-4">🎉</span>
          <h2 className="text-2xl font-bold mb-2">¡Compra exitosa!</h2>
          <p className="text-gray-500 mb-6">
            {shippingMethod.icon} Tu pedido llegará vía <strong>{shippingMethod.name}</strong>
            {shippingMethod.hours < 1 ? ` en ${shippingMethod.hours * 60} minutos` : ` en ${shippingMethod.hours} horas`}
          </p>

          {surpriseGift && (
            <Card className="p-4 mb-4 bg-yellow-50 border-yellow-200">
              <p className="text-sm">🎁 Incluye: <strong>{surpriseGift.name}</strong></p>
            </Card>
          )}

          <Card className="p-6 mb-6">
            <div className="space-y-3 text-left">
              <div className="flex justify-between"><span className="text-gray-500">Pedido</span><span className="font-medium">{orderResult.orderNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Envío</span><span className="font-medium">{shippingMethod.icon} {shippingMethod.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-bold text-purple-700">{formatCurrency(orderResult.total)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">🪙 Coins</span><span className="font-bold text-yellow-600">+{orderResult.coinsEarned}</span></div>
            </div>
          </Card>

          <div className="flex gap-3 justify-center">
            <Link href={`/orders/${orderResult.id}`}><Button>📦 Ver seguimiento</Button></Link>
            <Link href="/catalog"><Button variant="outline">Seguir comprando</Button></Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Suspense fallback={<div className="text-center py-16"><div className="animate-spin text-4xl">🛒</div></div>}>
        <CheckoutContent />
      </Suspense>
    </div>
  );
}
