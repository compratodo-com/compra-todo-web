/**
 * Paris.cl Scraper
 * Extrae imágenes reales de productos desde Paris.cl
 * NO necesita API key, NO bloquea (devuelve HTML con imágenes)
 */

import axios from "axios";

const client = axios.create({
  timeout: 10000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html",
    "Accept-Language": "es-CL,es;q=0.9",
  },
});

export async function searchParisImage(productName: string): Promise<string | null> {
  try {
    const query = productName
      .replace(/[^a-zA-Z0-9áéíóúñü\s]/g, "")
      .trim()
      .slice(0, 60);
    
    const { data: html } = await client.get(`https://www.paris.cl/search?q=${encodeURIComponent(query)}`);
    
    // Extraer todas las URLs de imágenes del HTML
    const imgRegex = /src="(https:\/\/cl-dam-resizer[^"]+\.jpg)"/g;
    const images: string[] = [];
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      if (!images.includes(match[1])) {
        images.push(match[1]);
      }
    }
    
    return images[0] || null;
  } catch (error) {
    console.error(`[Paris] Error buscando "${productName}":`, error instanceof Error ? error.message : error);
    return null;
  }
}

export async function searchParisImages(productName: string, count = 5): Promise<string[]> {
  try {
    const query = productName.replace(/[^a-zA-Z0-9áéíóúñü\s]/g, "").trim().slice(0, 60);
    const { data: html } = await client.get(`https://www.paris.cl/search?q=${encodeURIComponent(query)}`);
    
    const imgRegex = /src="(https:\/\/cl-dam-resizer[^"]+\.jpg)"/g;
    const images: string[] = [];
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      if (!images.includes(match[1])) {
        images.push(match[1]);
      }
    }
    
    return images.slice(0, count);
  } catch (error) {
    return [];
  }
}
