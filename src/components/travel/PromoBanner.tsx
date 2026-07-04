"use client";

import Link from "next/link";
import { Button } from "@/components/ui";

interface PromoBannerProps {
  title?: string;
  subtitle?: string;
  cta?: string;
  link?: string;
  gradient?: string;
}

export function PromoBanner({
  title = "🌴 ¿Sueñas con unas vacaciones increíbles?",
  subtitle = "Compra tu paquete y participa por un viaje completamente gratis para dos personas. Cada paquete adquirido es una oportunidad de ganar.",
  cta = "🎁 Participar ahora",
  link = "/travel",
  gradient = "from-purple-600 via-pink-500 to-orange-400",
}: PromoBannerProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${gradient} p-8 md:p-12 text-white`}>
      {/* Efectos decorativos */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-white/5 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-2xl md:text-3xl font-bold mb-3">{title}</h3>
          <p className="text-white/80 max-w-xl leading-relaxed">
            {subtitle}
          </p>
          <div className="flex items-center gap-4 mt-4 text-sm text-white/60">
            <span>✈️ Vuelos incluidos</span>
            <span>🏨 Hotel 5*</span>
            <span>🎁 + Sorpresas</span>
          </div>
        </div>
        <div className="flex-shrink-0">
          <Link href={link}>
            <Button className="bg-white text-purple-700 hover:bg-gray-100 font-bold text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all">
              {cta}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
