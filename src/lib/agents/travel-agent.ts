/**
 * Travel Packages Agent
 * Genera paquetes turísticos atractivos para usuarios latinoamericanos.
 * Corre semanalmente para renovar ofertas de viaje.
 */

import { prisma } from "@/lib/db/prisma";

const DESTINATIONS = [
  { city: "Cancún", country: "México", region: "Caribe", tags: ["playa", "todo-incluido", "relax"] },
  { city: "Río de Janeiro", country: "Brasil", region: "Sudamérica", tags: ["playa", "aventura", "cultura"] },
  { city: "Cusco", country: "Perú", region: "Sudamérica", tags: ["aventura", "cultura", "historia"] },
  { city: "Punta Cana", country: "República Dominicana", region: "Caribe", tags: ["playa", "todo-incluido", "romántico"] },
  { city: "Buenos Aires", country: "Argentina", region: "Sudamérica", tags: ["cultura", "gastronomía", "ciudad"] },
  { city: "Madrid", country: "España", region: "Europa", tags: ["cultura", "ciudad", "gastronomía"] },
  { city: "Orlando", country: "Estados Unidos", region: "Norteamérica", tags: ["parques", "familia", "diversión"] },
  { city: "París", country: "Francia", region: "Europa", tags: ["romántico", "cultura", "ciudad"] },
  { city: "Cartagena", country: "Colombia", region: "Sudamérica", tags: ["playa", "historia", "cultura"] },
  { city: "Miami", country: "Estados Unidos", region: "Norteamérica", tags: ["playa", "compras", "ciudad"] },
  { city: "Barcelona", country: "España", region: "Europa", tags: ["playa", "cultura", "gastronomía"] },
  { city: "San Pedro de Atacama", country: "Chile", region: "Sudamérica", tags: ["aventura", "naturaleza", "desierto"] },
  { city: "Torres del Paine", country: "Chile", region: "Patagonia", tags: ["naturaleza", "aventura", "trekking"] },
  { city: "Lima", country: "Perú", region: "Sudamérica", tags: ["gastronomía", "cultura", "ciudad"] },
  { city: "La Habana", country: "Cuba", region: "Caribe", tags: ["cultura", "historia", "playa"] },
  { city: "Tokio", country: "Japón", region: "Asia", tags: ["cultura", "tecnología", "gastronomía"] },
  { city: "Dubai", country: "Emiratos Árabes", region: "Oriente Medio", tags: ["lujo", "compras", "ciudad"] },
  { city: "Bariloche", country: "Argentina", region: "Patagonia", tags: ["naturaleza", "aventura", "nieve"] },
  { city: "Florianópolis", country: "Brasil", region: "Sudamérica", tags: ["playa", "naturaleza", "relax"] },
  { city: "Nueva York", country: "Estados Unidos", region: "Norteamérica", tags: ["ciudad", "cultura", "compras"] },
];

const ACCOMMODATIONS = [
  "Hotel 5 estrellas", "Resort todo incluido", "Hotel boutique", "Hostal premium",
  "Glamping", "Cabaña privada", "Apartamento vacacional", "Ecolodge",
];

const INCLUDES_OPTIONS = [
  ["Vuelo ida y vuelta", "Hotel {{noche}} noche", "Desayuno incluido", "Traslados aeropuerto"],
  ["Vuelo ida y vuelta", "Hotel {{noche}} noches", "Todo incluido", "Seguro de viaje"],
  ["Vuelo ida y vuelta", "Hotel {{noche}} noches", "Media pensión", "Tour de bienvenida"],
  ["Vuelo ida y vuelta", "Alojamiento {{noche}} noches", "Desayuno", "Actividad gratuita"],
];

const DURATIONS = [
  { label: "4 días / 3 noches", nights: 3, minPrice: 350000 },
  { label: "5 días / 4 noches", nights: 4, minPrice: 450000 },
  { label: "7 días / 6 noches", nights: 6, minPrice: 650000 },
  { label: "8 días / 7 noches", nights: 7, minPrice: 799000 },
  { label: "10 días / 9 noches", nights: 9, minPrice: 999000 },
  { label: "14 días / 13 noches", nights: 13, minPrice: 1499000 },
];

// Factores de precio por región (desde Chile)
const REGION_FACTORS: Record<string, number> = {
  "Sudamérica": 1.0,
  "Caribe": 1.3,
  "Norteamérica": 1.6,
  "Europa": 1.8,
  "Patagonia": 1.2,
  "Asia": 2.0,
  "Oriente Medio": 2.2,
};

const PROMOTIONAL_TAGS = [
  "🔥 Oferta relámpago", "⭐ Más vendido", "🎉 Paquete estrella",
  "💎 Experiencia VIP", "🌟 Recomendado", "🏆 Imperdible",
];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9áéíóúñü\s]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function generateTravelPackages(count = 5): Promise<number> {
  console.log(`[TravelAgent] 🧳 Generando ${count} paquetes de viaje...\n`);

  let created = 0;
  const selectedDests = [...DESTINATIONS].sort(() => Math.random() - 0.5).slice(0, count);

  for (const dest of selectedDests) {
    const duration = pickRandom(DURATIONS);
    const accommodation = pickRandom(ACCOMMODATIONS);
    const includes = pickRandom(INCLUDES_OPTIONS).map(i => i.replace("{{noche}}", String(duration.nights)));
    const regionFactor = REGION_FACTORS[dest.region] || 1.0;
    const basePrice = Math.round(duration.minPrice * regionFactor * (0.85 + Math.random() * 0.3));
    const hasDiscount = Math.random() < 0.4;
    const discountPct = hasDiscount ? Math.round(10 + Math.random() * 25) : null;
    const originalPrice = hasDiscount ? Math.round(basePrice * (1 + discountPct! / 100)) : null;
    const rating = (3.5 + Math.random() * 1.5).toFixed(1);
    const isPromotional = Math.random() < 0.3;

    // Título atractivo
    const title = `${pickRandom(["Viaje a", "Escápate a", "Descubre", "Aventura en", "Vacaciones en"])} ${dest.city}, ${dest.country}`;

    const slug = slugify(title);
    const existing = await prisma.travelPackage.findUnique({ where: { slug } });
    if (existing) continue;

    // Descripción
    const description = `Disfruta de unas vacaciones inolvidables en ${dest.city}. ${accommodation} de primera clase durante ${duration.label.toLowerCase()}. ${pickRandom([
      "Explora sus principales atractivos y vive experiencias únicas.",
      "Relájate y disfruta de paisajes increíbles.",
      "Una experiencia que combina aventura, cultura y confort.",
    ])} ${pickRandom([
      `Incluye ${includes.slice(0, 2).join(" y ")}.`,
      `Todo listo para que solo te preocupes de disfrutar: ${includes.slice(0, 3).join(", ")}.`,
    ])} Precio por persona, impuestos incluidos.`; // Precio referencial del mercado turístico.

    // Buscar imagen en Pexels con términos específicos del destino
    let images: string[] = [];
    if (process.env.PEXELS_API_KEY) {
      try {
        const { searchProductImages } = await import("@/lib/images/pexels");
        // Términos de búsqueda específicos por destino para obtener imágenes reales del lugar
        const searchTerms: Record<string, string> = {
          "Cancún": "Cancun Mexico beach resort",
          "Río de Janeiro": "Rio de Janeiro Brazil landmark",
          "Cusco": "Cusco Peru Machu Picchu",
          "Punta Cana": "Punta Cana Dominican Republic beach",
          "Buenos Aires": "Buenos Aires Argentina city",
          "Madrid": "Madrid Spain city landmark",
          "Orlando": "Orlando Florida theme park",
          "París": "Paris France Eiffel Tower",
          "Cartagena": "Cartagena Colombia colonial",
          "Miami": "Miami Florida beach skyline",
          "Barcelona": "Barcelona Spain architecture",
          "San Pedro de Atacama": "Atacama Desert Chile",
          "Torres del Paine": "Torres del Paine Patagonia",
          "Lima": "Lima Peru city",
          "La Habana": "Havana Cuba vintage",
          "Tokio": "Tokyo Japan city",
          "Dubai": "Dubai city skyline",
          "Bariloche": "Bariloche Argentina lake",
          "Florianópolis": "Florianopolis Brazil beach",
          "Nueva York": "New York City skyline Manhattan",
        };
        const query = searchTerms[dest.city] || `${dest.city} travel destination landmark`;
        const pexelImages = await searchProductImages(query, 8);
        if (pexelImages.length > 0) images = pexelImages;
      } catch {}
    }

    // Fallback: imágenes de picsum
    if (images.length === 0) {
      for (let i = 0; i < 3; i++) {
        images.push(`https://picsum.photos/seed/${slug}${i}/800/600`);
      }
    }

    const tag = pickRandom(PROMOTIONAL_TAGS);

    await prisma.travelPackage.create({
      data: {
        title,
        slug,
        destination: `${dest.city}, ${dest.country}`,
        description,
        price: basePrice,
        originalPrice,
        images,
        thumbnail: images[0],
        duration: duration.label,
        includes,
        rating: parseFloat(rating),
        tags: [dest.region, ...dest.tags, tag],
        promotional: isPromotional,
        discountPct,
      },
    });

    console.log(`✅ ${title.padEnd(45)} $${basePrice.toLocaleString("es-CL")} | ${dest.region} | ${duration.label}`);
    created++;
  }

  console.log(`\n[TravelAgent] ✅ ${created} paquetes creados`);
  return created;
}
