import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CURRENCY_LOCALE: Record<string, string> = {
  CLP: "es-CL",
  MXN: "es-MX",
  ARS: "es-AR",
  COP: "es-CO",
  PEN: "es-PE",
  BRL: "pt-BR",
  USD: "en-US",
};

export function formatCurrency(amount: number, currency = "CLP"): string {
  const locale = CURRENCY_LOCALE[currency] || "es-CL";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("es-CL")}`;
  }
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  if (hours > 48) return formatDate(d);
  if (hours > 24) return "ayer";
  if (hours > 1) return `hace ${hours} horas`;
  if (hours === 1) return "hace 1 hora";
  if (minutes > 1) return `hace ${minutes} minutos`;
  return "hace un momento";
}

export function generateOrderNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `CT-${dateStr}-${random}`;
}

export function generateTrackingCode(): string {
  const prefix = "MLC";
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `${prefix}-${random}`;
}

export function generateOrderEvents(isExpress = false): Array<{
  status: string;
  title: string;
  description: string;
  location: string;
  delayHours: number;
  isMilestone: boolean;
}> {
  const baseTimeline = [
    {
      status: "confirmed",
      title: "Pedido confirmado",
      description: "Hemos recibido tu pedido y está siendo procesado.",
      location: "",
      delayHours: 0,
      isMilestone: true,
    },
    {
      status: "preparing",
      title: "En preparación",
      description: "Tu pedido está siendo preparado en nuestra bodega.",
      location: "Bodega Central",
      delayHours: isExpress ? 0.5 : 3,
      isMilestone: false,
    },
    {
      status: "picked_up",
      title: "Retirado por el courier",
      description: "El courier ha retirado tu pedido desde nuestra bodega.",
      location: "Bodega Central",
      delayHours: isExpress ? 1 : 6,
      isMilestone: true,
    },
    {
      status: "in_hub",
      title: "En centro de distribución",
      description: "Tu pedido llegó al centro de distribución y está siendo clasificado.",
      location: "CD Pudahuel",
      delayHours: isExpress ? 2 : 14,
      isMilestone: false,
    },
    {
      status: "in_transit",
      title: "En tránsito",
      description: "Tu pedido está en ruta hacia tu comuna.",
      location: "Hub Quilicura",
      delayHours: isExpress ? 4 : 24,
      isMilestone: true,
    },
    {
      status: "out_for_delivery",
      title: "En reparto",
      description: "Tu pedido está siendo repartido por nuestro courier.",
      location: "Tu comuna",
      delayHours: isExpress ? 8 : 36,
      isMilestone: true,
    },
    {
      status: "delivered",
      title: "¡Entregado!",
      description: "Tu pedido ha sido entregado con éxito. ¡Disfrútalo!",
      location: "",
      delayHours: isExpress ? 12 : 48,
      isMilestone: true,
    },
  ];

  // 5% de probabilidad de retraso aleatorio
  const hasDelay = Math.random() < 0.05;
  if (hasDelay) {
    const delayIndex = Math.floor(Math.random() * 3) + 3;
    baseTimeline.splice(delayIndex, 0, {
      status: "delayed",
      title: "Reprogramado por alta demanda",
      description:
        "Debido al alto volumen de despachos, tu pedido ha sido reprogramado. Estará en ruta dentro de las próximas horas.",
      location: "CD Pudahuel",
      delayHours: baseTimeline[delayIndex].delayHours + 4,
      isMilestone: false,
    });
  }

  return baseTimeline;
}

export function getLevelInfo(totalSpent: number) {
  const levels = [
    { level: 1, title: "Novato", minSpent: 0, benefits: "Catálogo base, ruleta estándar" },
    { level: 2, title: "Cazaofertas", minSpent: 300000, benefits: "Ruleta mejorada (hasta 40%), acceso anticipado a ofertas flash" },
    { level: 3, title: "Comprador Pro", minSpent: 1500000, benefits: "Envío express, cofres diarios" },
    { level: 4, title: "Maestro del Carrito", minSpent: 5000000, benefits: "Sección VIP, doble coins fines de semana" },
    { level: 5, title: "Leyenda Compra-Todo", minSpent: 15000000, benefits: "Ruleta dorada, título exclusivo, Salón de la Fama" },
  ];

  let currentLevel = levels[0];
  let nextLevel = levels[1];
  for (let i = levels.length - 1; i >= 0; i--) {
    if (totalSpent >= levels[i].minSpent) {
      currentLevel = levels[i];
      nextLevel = levels[i + 1] || null;
      break;
    }
  }

  const progress = nextLevel
    ? ((totalSpent - currentLevel.minSpent) / (nextLevel.minSpent - currentLevel.minSpent)) * 100
    : 100;

  return { ...currentLevel, progress, nextLevel: nextLevel?.title || null };
}

export function getXPForLevel(level: number): number {
  return level * 500 + (level - 1) * 250;
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
