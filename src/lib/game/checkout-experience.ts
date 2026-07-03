/**
 * Experiencia de compra gamificada
 * Envíos, cupones, packs y sorpresas
 */

// ─── MÉTODOS DE ENVÍO ───
export interface ShippingMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  hours: number;
  price: number; // en CLP
  probability: number; // 0-1, qué tan común es
  color: string;
}

export const SHIPPING_METHODS: ShippingMethod[] = [
  { id: "normal", name: "Envío Normal", icon: "🚚", description: "Llega en 24-48 hrs hábiles. Seguimiento incluido.", hours: 48, price: 0, probability: 0.3, color: "blue" },
  { id: "express", name: "Envío Express", icon: "⚡", description: "Entregado en menos de 12 horas. Prioridad absoluta.", hours: 12, price: 4990, probability: 0.25, color: "yellow" },
  { id: "drone", name: "Envío por Drone", icon: "🛸", description: "Tu pedido vuela directo a tu casa en 4 horas.", hours: 4, price: 9990, probability: 0.2, color: "purple" },
  { id: "aereo", name: "Envío por Avión", icon: "✈️", description: "Despacho aéreo prioritario. Recibes en 2 horas.", hours: 2, price: 19990, probability: 0.15, color: "indigo" },
  { id: "teletransportacion", name: "Teletransportación", icon: "🌀", description: "Tecnología cuántica. Llega en 5 minutos.", hours: 0.1, price: 49990, probability: 0.08, color: "pink" },
  { id: "ultra_rapido", name: "Envío Ultra Rápido", icon: "🚀", description: "Tan rápido que ni lo sentirás. ¿O sí?", hours: 0.5, price: 99990, probability: 0.02, color: "red" },
];

export function getRandomShippingMethod(): ShippingMethod {
  const rand = Math.random();
  let cumulative = 0;
  for (const method of SHIPPING_METHODS) {
    cumulative += method.probability;
    if (rand <= cumulative) return method;
  }
  return SHIPPING_METHODS[0];
}

// ─── CUPONES ───
export interface Coupon {
  code: string;
  type: "discount" | "free_shipping" | "bonus_coins" | "extra_gift";
  value: number;
  label: string;
  description: string;
  icon: string;
}

const COUPON_TEMPLATES: Omit<Coupon, "code">[] = [
  { type: "discount", value: 10, label: "10% OFF", description: "Descuento del 10% en tu próxima compra", icon: "🎫" },
  { type: "discount", value: 15, label: "15% OFF", description: "Descuento especial del 15%", icon: "🏷️" },
  { type: "discount", value: 20, label: "20% OFF", description: "Súper descuento del 20%", icon: "💥" },
  { type: "discount", value: 25, label: "25% OFF", description: "Descuento bomba del 25%", icon: "🔥" },
  { type: "free_shipping", value: 0, label: "Envío Gratis", description: "Envío completamente gratis en tu próxima compra", icon: "📦" },
  { type: "free_shipping", value: 0, label: "Envío Express Gratis", description: "Mejora tu envío a Express sin costo", icon: "⚡" },
  { type: "bonus_coins", value: 500, label: "500 🪙 Bonus", description: "500 CompraCoins de regalo", icon: "🪙" },
  { type: "bonus_coins", value: 1000, label: "1000 🪙 Mega Bonus", description: "1000 CompraCoins extras", icon: "💰" },
  { type: "extra_gift", value: 0, label: "🎁 Regalo Sorpresa", description: "Un regalo especial con tu próxima compra", icon: "🎁" },
];

export function generateRandomCoupon(): Coupon {
  const template = COUPON_TEMPLATES[Math.floor(Math.random() * COUPON_TEMPLATES.length)];
  const code = `CT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  return { ...template, code };
}

// ─── REGALOS SORPRESA ───
export interface SurpriseGift {
  name: string;
  icon: string;
  description: string;
}

const SURPRISE_GIFTS: SurpriseGift[] = [
  { name: "Stickers Compra-Todo", icon: "🦄", description: "Set de stickers exclusivos" },
  { name: "Llavero Personalizado", icon: "🔑", description: "Llavero con tu alias grabado" },
  { name: "500 Coins Bonus", icon: "🪙", description: "500 CompraCoins extras" },
  { name: "Funsion de Envío", icon: "🚀", description: "Mejora gratis a envío Ultra Rápido" },
  { name: "Caja Misteriosa", icon: "📦", description: "Una sorpresa física (simulada)" },
  { name: "Tarjeta Diamante", icon: "💎", description: "Acceso VIP por 7 días" },
];

export function maybeGetSurpriseGift(): SurpriseGift | null {
  // 10% de probabilidad
  if (Math.random() > 0.1) return null;
  return SURPRISE_GIFTS[Math.floor(Math.random() * SURPRISE_GIFTS.length)];
}

// ─── PROMOCIONES RELACIONADAS ───
export interface PackPromotion {
  name: string;
  description: string;
  discount: number;
  icon: string;
  products: string[];
}

export function getRelatedPromotions(categoryName?: string): PackPromotion[] {
  const packs: PackPromotion[] = [
    { name: "Combo Tecnológico", description: "Lleva 2 productos tech y ahorra", discount: 15, icon: "💻", products: [] },
    { name: "Pack Gamers", description: "Completa tu setup gamer", discount: 20, icon: "🎮", products: [] },
    { name: "Dúo Deportivo", description: "Dos artículos deportivos al mejor precio", discount: 10, icon: "⚽", products: [] },
    { name: "Trío de Belleza", description: "Tres productos de belleza en uno", discount: 25, icon: "💄", products: [] },
    { name: "Pareja de Moda", description: "Combina y ahorra en vestuario", discount: 15, icon: "👕", products: [] },
  ];
  return packs.slice(0, 2);
}
