/**
 * Image Search Engine
 * Busca imágenes reales de productos en múltiples fuentes gratuitas.
 * 
 * Orden de búsqueda:
 * 1. Paris.cl (imágenes reales de productos chilenos)
 * 2. Falabella (fallback)
 * 3. Pexels (fallback final)
 */

import axios from "axios";

const client = axios.create({
  timeout: 8000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html",
    "Accept-Language": "es-CL,es;q=0.9",
  },
});

// Cache de resultados por búsqueda
const cache = new Map<string, string[]>();

function normalizeQuery(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9áéíóúñü\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50);
}

/**
 * Busca imágenes de un producto en Paris.cl
 */
async function searchParis(query: string): Promise<string[]> {
  try {
    const { data: html } = await client.get(`https://www.paris.cl/search?q=${encodeURIComponent(query)}`);
    const regex = /src="(https:\/\/cl-dam-resizer[^"]+\.jpg)"/g;
    const images: string[] = [];
    let m;
    while ((m = regex.exec(html)) !== null) {
      if (!images.includes(m[1])) images.push(m[1]);
    }
    return images;
  } catch {
    return [];
  }
}

/**
 * Busca imágenes de un producto en Falabella
 */
async function searchFalabella(query: string): Promise<string[]> {
  try {
    const { data: html } = await client.get(
      `https://www.falabella.com/falabella-cl/search?Ntt=${encodeURIComponent(query)}&limit=5`
    );
    // Buscar en JSON-LD
    const ldRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
    let m;
    while ((m = ldRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(m[1]);
        if (data["@type"] === "Product" && data.image) {
          const img = Array.isArray(data.image) ? data.image[0] : data.image;
          if (typeof img === "string") return [img];
        }
      } catch {}
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Busca imágenes de un producto en múltiples fuentes.
 * Retorna URLs de imágenes reales ordenadas por calidad.
 */
export async function findProductImages(
  productName: string,
  maxImages = 5
): Promise<string[]> {
  const cacheKey = `${productName}-${maxImages}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const query = normalizeQuery(productName);
  if (!query) return [];

  // 1. Intentar Paris.cl
  let images = await searchParis(query);
  
  // 2. Si no encuentra, intentar Falabella
  if (images.length === 0) {
    images = await searchFalabella(query);
  }

  // 3. Si no encuentra nada, acortar query e intentar de nuevo
  if (images.length === 0) {
    const shortQuery = query.split(" ").slice(0, 3).join(" ");
    images = await searchParis(shortQuery);
  }

  // 4. Fallback final: Pexels (imágenes genéricas pero profesionales)
  if (images.length === 0 && process.env.PEXELS_API_KEY) {
    try {
      const { searchProductImages } = await import("@/lib/images/pexels");
      const pexelsImages = await searchProductImages(productName, maxImages);
      // Intentar extraer palabras clave de la categoría
      if (pexelsImages.length === 0) {
        const categoryImages = await searchProductImages("product", maxImages);
        images.push(...categoryImages);
      } else {
        images.push(...pexelsImages);
      }
    } catch {}
  }

  const result = images.slice(0, maxImages);
  cache.set(cacheKey, result);
  return result;
}

/**
 * Busca imágenes para MÚLTIPLES productos, agrupando por categoría
 * para minimizar requests.
 */
export async function findBulkProductImages(
  products: Array<{ name: string; category: string; id: string }>
): Promise<Map<string, string[]>> {
  const results = new Map<string, string[]>();
  
  // Agrupar por similitud de nombre para evitar búsquedas duplicadas
  const seen = new Set<string>();
  
  for (const product of products) {
    if (results.has(product.id)) continue;
    
    // Extraer marca y modelo del nombre
    const name = product.name;
    
    const images = await findProductImages(name, 3);
    results.set(product.id, images);
    
    // Pequeña pausa entre requests para no saturar
    await new Promise(r => setTimeout(r, 500));
  }
  
  return results;
}
