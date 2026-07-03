"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Button, Badge } from "@/components/ui";

interface RouletteProps {
  onSpin: (result: RouletteResult) => void;
  disabled?: boolean;
  level?: number;
}

interface RouletteResult {
  type: string;
  label: string;
  value: number | null;
  multiplier: number;
}

const SEGMENTS = [
  { label: "50 🪙", color: "#6C3AF5", weight: 30 },
  { label: "100 🪙", color: "#7C4AFF", weight: 20 },
  { label: "5% OFF", color: "#10B981", weight: 15 },
  { label: "200 🪙", color: "#F59E0B", weight: 10 },
  { label: "10% OFF", color: "#3B82F6", weight: 10 },
  { label: "💀", color: "#EF4444", weight: 5 },
  { label: "20% OFF", color: "#8B5CF6", weight: 5 },
  { label: "x2 🪙", color: "#EC4899", weight: 5 },
];

export function Roulette({ onSpin, disabled = false, level = 1 }: RouletteProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<RouletteResult | null>(null);

  const handleSpin = async () => {
    if (spinning || disabled) return;
    setSpinning(true);
    setResult(null);

    // Simulate API call
    const res = await fetch("/api/game/spin", {
      method: "POST",
      body: JSON.stringify({ type: level >= 5 ? "golden" : level >= 2 ? "improved" : "standard" }),
    });

    if (!res.ok) {
      setSpinning(false);
      return;
    }

    const data = await res.json();

    // Animate
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const targetIndex = Math.floor(Math.random() * SEGMENTS.length);
    const segmentAngle = 360 / SEGMENTS.length;
    const newRotation = rotation + 360 * extraSpins + targetIndex * segmentAngle;

    setRotation(newRotation);

    setTimeout(() => {
      setSpinning(false);
      setResult(data as RouletteResult);
      onSpin(data as RouletteResult);
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Roulette Wheel */}
      <div className="relative w-72 h-72">
        <div
          className="w-full h-full rounded-full border-4 border-purple-600 shadow-xl transition-transform duration-[3000ms] ease-out"
          style={{
            transform: `rotate(${rotation}deg)`,
            background: `conic-gradient(${SEGMENTS.map(
              (seg, i) =>
                `${seg.color} ${(i * 360) / SEGMENTS.length}deg ${((i + 1) * 360) / SEGMENTS.length}deg`
            ).join(", ")})`,
          }}
        >
          {/* Center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-full shadow-inner flex items-center justify-center">
              <span className="text-2xl">🎰</span>
            </div>
          </div>
        </div>

        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
          <svg width="24" height="24" viewBox="0 0 24 24" className="text-purple-600">
            <polygon points="12,24 0,0 24,0" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="text-center animate-bounce-in">
          <p className="text-2xl font-bold text-purple-700">
            {result.label}
          </p>
          <p className="text-sm text-gray-500">
            {result.type === "coins"
              ? "¡CompraCoins ganados!"
              : result.type === "discount"
              ? "Descuento para tu compra"
              : result.type === "boost"
              ? "¡Multiplicador activado!"
              : "¡Sigue participando!"}
          </p>
        </div>
      )}

      <Button
        onClick={handleSpin}
        disabled={disabled || spinning}
        size="lg"
        loading={spinning}
        className="text-lg px-8"
      >
        {spinning ? "Girando..." : "🎡 ¡Girar ruleta!"}
      </Button>
    </div>
  );
}
