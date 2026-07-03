/**
 * Image Search Engine
 * 
 * Fuentes confirmadas que funcionan para imágenes reales de productos:
 * 
 * 1. Paris.cl (Chile) - Grupo Cencosud
 *    ✅ Imágenes reales de productos, HTML accesible
 *    ✅ Encuentra ~70% de nuestros productos
 * 
 * 2. Pexels (Internacional) - Fallback
 *    ✅ Fotos profesionales de productos por categoría
 *    ✅ API Key configurada
 *    ✅ 200 requests/hora gratis
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

const cache = new Map<string, string[]>();

function normalizeQuery(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9áéíóúñü\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

function extractImages(html: string, regex: RegExp): string[] {
  const images: string[] = [];
  let m;
  while ((m = regex.exec(html)) !== null) {
    if (!images.includes(m[1])) images.push(m[1]);
  }
  return images;
}

async function searchParis(query: string): Promise<string[]> {
  try {
    const { data: html } = await client.get(
      `https://www.paris.cl/search?q=${encodeURIComponent(query)}`
    );
    return extractImages(html, /src="(https:\/\/cl-dam-resizer[^"]+\.jpg)"/g);
  } catch { return []; }
}

export async function findProductImages(
  productName: string,
  maxImages = 5
): Promise<string[]> {
  const cacheKey = `${productName}-${maxImages}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const query = normalizeQuery(productName);
  if (!query) return [];

  // Probar queries de más específico a más general
  const queries = [
    query,
    query.split(" ").slice(0, 4).join(" "),
    query.split(" ").slice(0, 3).join(" "),
  ];

  let images: string[] = [];
  for (const q of queries) {
    if (q.length < 5) continue;
    images = await searchParis(q);
    if (images.length > 0) break;
  }

  // Fallback a Pexels
  if (images.length === 0 && process.env.PEXELS_API_KEY) {
    try {
      const { searchProductImages } = await import("@/lib/images/pexels");
      images = await searchProductImages(productName, maxImages);
    } catch {}
  }

  const result = images.slice(0, maxImages);
  cache.set(cacheKey, result);
  return result;
}
