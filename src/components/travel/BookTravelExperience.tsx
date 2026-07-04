"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/components/currency/CurrencySelector";
import { convertPrice } from "@/lib/currency";

interface BookingPackage {
  id: string;
  title: string;
  slug: string;
  destination: string;
  price: number;
  duration: string;
  includes: string[];
  thumbnail: string | null;
}

const LUGGAGE_OPTIONS = [
  { id: "carryon", name: "Equipaje de mano", icon: "💼", desc: "Bolso o mochila pequeña, hasta 7kg", price: 0, included: true },
  { id: "checked", name: "Maleta de bodega", icon: "🧳", desc: "Maleta de 23kg, medidas estándar", price: 54990, included: false },
  { id: "extra_checked", name: "Maleta extra", icon: "🧳", desc: "Segunda maleta de 23kg adicional", price: 89990, included: false },
  { id: "sports", name: "Equipo deportivo", icon: "⛷️", desc: "Equipo de esquí, surf, golf o bicicleta", price: 129990, included: false },
];

const INSURANCE_OPTIONS = [
  { id: "none", name: "Sin seguro", icon: "❌", desc: "Viaja sin protección adicional", price: 0, recommended: false },
  { id: "basic", name: "Seguro Básico", icon: "🛡️", desc: "Cobertura médica hasta $10,000 USD", price: 29990, recommended: false },
  { id: "premium", name: "Seguro Premium", icon: "⭐", desc: "Cobertura médica hasta $100,000 USD + cancelación + equipaje", price: 59990, recommended: true },
  { id: "full", name: "Seguro Full", icon: "💎", desc: "Cobertura total: médica, cancelación, equipaje, vuelos, asistencia 24/7", price: 99990, recommended: false },
];

const ADDONS = [
  { id: "priority_boarding", name: "Embarque prioritario", icon: "✈️", price: 19990 },
  { id: "lounge", name: "Acceso a sala VIP", icon: "🍸", price: 39990 },
  { id: "gift", name: "Kit de bienvenida", icon: "🎁", price: 14990 },
  { id: "tour", name: "Tour guiado privado", icon: "📸", price: 59990 },
];

const PROMOS = [
  { name: "🔥 2x1 en maletas", desc: "Segunda maleta completamente gratis", code: "MALETA2X1", active: true },
  { name: "🎉 Upgrade de habitación", desc: "Mejora a suite sin costo adicional", code: "SUITEUP", active: true },
  { name: "💎 Desayuno incluido", desc: "Desayuno buffet todos los días", code: "DESAYUNO", active: true },
  { name: "🪙 1000 Coins Bonus", desc: "1000 CompraCoins al reservar hoy", code: "COINS1000", active: true },
];

interface BookTravelExperienceProps {
  pkg: BookingPackage;
}

export function BookTravelExperience({ pkg }: BookTravelExperienceProps) {
  const { currency } = useCurrency();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [passengers, setPassengers] = useState(1);
  const [selectedLuggage, setSelectedLuggage] = useState<string[]>(["carryon"]);
  const [insurance, setInsurance] = useState("none");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [surpriseGift, setSurpriseGift] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [email, setEmail] = useState("");

  const displayPrice = convertPrice(pkg.price, currency);
  const luggageCost = selectedLuggage
    .filter(l => l !== "carryon")
    .reduce((sum, l) => sum + (LUGGAGE_OPTIONS.find(o => o.id === l)?.price || 0), 0);
  const insuranceCost = INSURANCE_OPTIONS.find(i => i.id === insurance)?.price || 0;
  const addonsCost = selectedAddons.reduce((sum, a) => sum + (ADDONS.find(o => o.id === a)?.price || 0), 0);
  const totalPerPerson = pkg.price + luggageCost + insuranceCost + addonsCost;
  const total = totalPerPerson * passengers;

  const handleConfirm = () => {
    // 20% de probabilidad de regalo sorpresa
    if (Math.random() < 0.2) {
      const gifts = ["Upgrade a Suite 🏨", "Cena romántica 🍷", "Tour gratuito 🎫", "Spa incluido 💆", "Maleta extra gratis 🧳"];
      setSurpriseGift(gifts[Math.floor(Math.random() * gifts.length)]);
    }
    setConfirmed(true);
  };

  const steps = [
    { num: 1, label: "Pasajeros" },
    { num: 2, label: "Equipaje" },
    { num: 3, label: "Seguro" },
    { num: 4, label: "Extras" },
    { num: 5, label: "Confirmar" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-8 text-sm overflow-x-auto pb-2">
        {steps.map((s) => (
          <div key={s.num} className="flex items-center gap-1 sm:gap-2">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              step === s.num ? "bg-purple-600 text-white" : step > s.num ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
            }`}>{s.num}</div>
            <span className={`hidden sm:inline text-xs ${step === s.num ? "text-purple-700 font-medium" : "text-gray-400"}`}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Step 1: Pasajeros */}
      {step === 1 && (
        <div className="max-w-lg mx-auto text-center">
          <span className="text-5xl block mb-4">👥</span>
          <h2 className="text-2xl font-bold mb-2">¿Cuántos viajeros?</h2>
          <p className="text-gray-500 mb-8">Selecciona el número de pasajeros para tu viaje</p>
          <div className="flex items-center justify-center gap-6 mb-8">
            <button onClick={() => setPassengers(Math.max(1, passengers - 1))} className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 text-xl font-bold">-</button>
            <span className="text-4xl font-bold text-purple-700">{passengers}</span>
            <button onClick={() => setPassengers(Math.min(8, passengers + 1))} className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 text-xl font-bold">+</button>
          </div>
          <p className="text-sm text-gray-400 mb-8">{passengers === 1 ? "1 pasajero" : `${passengers} pasajeros`}</p>
          <Button size="lg" onClick={() => setStep(2)}>Elegir equipaje →</Button>
        </div>
      )}

      {/* Step 2: Equipaje */}
      {step === 2 && (
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">🧳 ¿Qué equipaje llevas?</h2>
          <p className="text-gray-500 text-center mb-6">Selecciona los tipos de equipaje para tu viaje</p>
          <div className="space-y-3 mb-8">
            {LUGGAGE_OPTIONS.map((opt) => {
              const isSelected = selectedLuggage.includes(opt.id);
              return (
                <button key={opt.id} onClick={() => {
                  if (opt.id === "carryon") return; // Siempre incluido
                  setSelectedLuggage(prev => isSelected ? prev.filter(l => l !== opt.id) : [...prev, opt.id]);
                }} className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected ? "border-purple-600 bg-purple-50" : "border-gray-200 bg-white"
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{opt.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{opt.name} {opt.included && <Badge variant="success">Incluido</Badge>}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                    <p className="font-bold text-purple-700">{opt.price === 0 ? "Gratis" : formatCurrency(opt.price, currency)}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setStep(1)}>Volver</Button>
            <Button onClick={() => setStep(3)}>Elegir seguro →</Button>
          </div>
        </div>
      )}

      {/* Step 3: Seguro */}
      {step === 3 && (
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">🛡️ Protege tu viaje</h2>
          <p className="text-gray-500 text-center mb-6">Elige el nivel de protección que prefieras</p>
          <div className="space-y-3 mb-8">
            {INSURANCE_OPTIONS.map((opt) => (
              <button key={opt.id} onClick={() => setInsurance(opt.id)} className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                insurance === opt.id ? "border-purple-600 bg-purple-50" : "border-gray-200 bg-white"
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{opt.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{opt.name} {opt.recommended && <Badge variant="warning">Recomendado</Badge>}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                  <p className="font-bold text-purple-700">{opt.price === 0 ? "Gratis" : formatCurrency(opt.price, currency)}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setStep(2)}>Volver</Button>
            <Button onClick={() => setStep(4)}>Agregar extras →</Button>
          </div>
        </div>
      )}

      {/* Step 4: Add-ons + Promos */}
      {step === 4 && (
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">🎁 Extras y promociones</h2>
          <p className="text-gray-500 text-center mb-6">Personaliza tu experiencia</p>

          <h3 className="font-semibold text-gray-900 mb-3">Extras opcionales</h3>
          <div className="space-y-2 mb-6">
            {ADDONS.map((addon) => {
              const isSelected = selectedAddons.includes(addon.id);
              return (
                <button key={addon.id} onClick={() => setSelectedAddons(prev => isSelected ? prev.filter(a => a !== addon.id) : [...prev, addon.id])}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    isSelected ? "border-purple-600 bg-purple-50" : "border-gray-200 bg-white"
                  }`}>
                  <span className="text-xl">{addon.icon}</span>
                  <span className="flex-1 text-sm font-medium">{addon.name}</span>
                  <span className="text-sm font-bold text-purple-700">{formatCurrency(addon.price, currency)}</span>
                </button>
              );
            })}
          </div>

          <h3 className="font-semibold text-gray-900 mb-3">Promociones activas</h3>
          <div className="grid grid-cols-1 gap-2 mb-8">
            {PROMOS.slice(0, 2).map((promo, i) => (
              <div key={i} className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                <span className="text-sm">{promo.name}</span>
                <span className="text-xs text-green-600 flex-1">{promo.desc}</span>
                <Badge variant="success">Auto-aplicado</Badge>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setStep(3)}>Volver</Button>
            <Button onClick={() => setStep(5)}>Revisar y confirmar →</Button>
          </div>
        </div>
      )}

      {/* Step 5: Confirmar */}
      {step === 5 && !confirmed && (
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">📋 Resumen de tu viaje</h2>
          <Card className="p-6 mb-6">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="font-medium text-gray-900">{pkg.title}</span>
                <span className="text-purple-700 font-bold">{formatCurrency(displayPrice, currency)} x {passengers}</span>
              </div>
              <div className="flex justify-between"><span>👥 Pasajeros</span><span>{passengers}</span></div>
              <div className="flex justify-between"><span>🧳 Equipaje</span><span>{selectedLuggage.length} pieza(s)</span></div>
              {luggageCost > 0 && <div className="flex justify-between text-gray-500"><span>Costo de equipaje</span><span>{formatCurrency(luggageCost, currency)}</span></div>}
              <div className="flex justify-between"><span>🛡️ Seguro</span><span>{INSURANCE_OPTIONS.find(i => i.id === insurance)?.name}</span></div>
              {insuranceCost > 0 && <div className="flex justify-between text-gray-500"><span>Costo del seguro</span><span>{formatCurrency(insuranceCost, currency)}</span></div>}
              {selectedAddons.length > 0 && <div className="flex justify-between text-gray-500"><span>🎁 Extras</span><span>{formatCurrency(addonsCost, currency)}</span></div>}
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Total</span><span className="text-purple-700">{formatCurrency(total, currency)}</span>
              </div>
            </div>
          </Card>

          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 block mb-2">📧 Recibir ticket por correo</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setStep(4)}>Volver</Button>
            <Button size="lg" onClick={handleConfirm}>✅ Confirmar y reservar</Button>
          </div>
        </div>
      )}

      {/* Confirmado */}
      {confirmed && (
        <div className="max-w-lg mx-auto text-center">
          <span className="text-6xl block mb-4">🎉</span>
          <h2 className="text-2xl font-bold mb-2">¡Viaje reservado!</h2>
          <p className="text-gray-500 mb-6">Tu experiencia ha sido confirmada. Revisa tu correo para el ticket.</p>

          {surpriseGift && (
            <Card className="p-4 mb-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300">
              <span className="text-2xl block mb-1">🎁</span>
              <Badge variant="warning">¡REGALO SORPRESA!</Badge>
              <p className="font-bold text-gray-900 mt-2">{surpriseGift}</p>
              <p className="text-xs text-gray-500">Agregado automáticamente a tu reserva</p>
            </Card>
          )}

          <Card className="p-6 mb-6 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Destino</span><span className="font-medium">{pkg.destination}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Duración</span><span className="font-medium">{pkg.duration}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Pasajeros</span><span className="font-medium">{passengers}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-bold text-purple-700">{formatCurrency(total, currency)}</span></div>
              {email && <div className="flex justify-between"><span className="text-gray-500">Ticket enviado a</span><span className="font-medium text-sm">{email}</span></div>}
            </div>
          </Card>

          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push("/travel")}>🧳 Ver más viajes</Button>
            <Button variant="outline" onClick={() => router.push("/catalog")}>🛍️ Ir al catálogo</Button>
          </div>
        </div>
      )}
    </div>
  );
}
