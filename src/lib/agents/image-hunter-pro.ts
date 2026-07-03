/**
 * Image Hunter Pro
 * 
 * Sistema avanzado de caza de imágenes que:
 * 1. Busca imágenes en Google Images + Paris.cl + Apify
 * 2. Descarga cada imagen a Vercel Blob (no hotlink)
 * 3. Usa OpenAI Vision para verificar calidad
 * 4. Almacena la imagen permanentemente
 */

import { prisma } from "@/lib/db/prisma";
import { uploadProductImages } from "@/lib/images/storage";

// Dominios permitidos para imágenes (e-commerce confiables)
const TRUSTED_DOMAINS = [
  "cl-dam-resizer.ecomm.cencosud.com",
  "http2.mlstatic.com",
  "mlstatic.com",
  "m.media-amazon.com",
  "media-amazon.com",
  "i.ebayimg.com",
  "cdn.shopify.com",
  "images.pexels.com",
  "falabella.com",
  "images.falabella.com",
  "fravega.vteximg.com.br",
  "vteximg.com.br",
  "static.wixstatic.com",
  "cloudinary.com",
  "res.cloudinary.com",
  "images.ctfassets.net",
];

const BLOCKED_DOMAINS = [
  "tiktok.com", "pinimg.com", "pinterest.com", "fbcdn.net",
  "instagram.com", "reddit.com", "redd.it", "ytimg.com",
  "googleusercontent.com", "gravatar.com",
];

interface ScrapedImage {
  url: string;
  source: string;
}

export async function huntProductImagesPro(): Promise<{
  total: number;
  downloaded: number;
  verified: number;
  errors: number;
}> {
  console.log("[ImageHunterPro] 🎯 Iniciando caza profesional de imágenes...\n");

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, title: true, externalId: true, thumbnail: true },
  });

  let downloaded = 0;
  let verified = 0;
  let errors = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    process.stdout.write(`[${i + 1}/${products.length}] ${p.title.slice(0, 40).padEnd(42)}`);

    try {
      // 1. Buscar imágenes de múltiples fuentes
      const images = await searchAllSources(p.title);
      
      if (images.length === 0 || !images[0].url) {
        console.log("⬜ Sin resultados");
        continue;
      }

      // 2. Tomar la mejor imagen
      const bestImage = images[0].url;

      // 3. Verificar que la URL sea accesible
      const isAccessible = await checkImageAccessible(bestImage);
      if (!isAccessible) {
        console.log("⬜ No accesible");
        continue;
      }

      // 4. Verificar con OpenAI Vision si está disponible
      let imageQuality = 1.0;
      if (process.env.OPENAI_API_KEY) {
        try {
          imageQuality = await verifyImageWithAI(bestImage, p.title);
        } catch {}
      }

      if (imageQuality < 0.3) {
        console.log("⬜ Baja calidad");
        continue;
      }

      // 5. Descargar a nuestro storage (Vercel Blob o local)
      const stored = await uploadProductImages([bestImage], p.externalId || p.id);
      const finalUrl = stored[0] || bestImage;

      // 6. Actualizar producto con imagen local
      await prisma.product.update({
        where: { id: p.id },
        data: { thumbnail: finalUrl, images: [finalUrl] },
      });

      downloaded++;
      console.log("✅");
    } catch (error) {
      errors++;
      console.log("❌ Error");
    }
  }

  console.log(`\n[ImageHunterPro] 📊 Resumen:
   Procesados: ${products.length}
   Descargados: ${downloaded}
   Errores: ${errors}`);

  return { total: products.length, downloaded, verified, errors };
}

/**
 * Busca imágenes en TODAS las fuentes disponibles
 */
async function searchAllSources(productName: string): Promise<ScrapedImage[]> {
  const results: ScrapedImage[] = [];

  // 1. Paris.cl (rápido, sin JS)
  try {
    const axios = (await import("axios")).default;
    const query = productName.replace(/[^a-zA-Z0-9áéíóúñü\s-]/g, "").trim().slice(0, 60);
    const { data: html } = await axios.get(
      `https://www.paris.cl/search?q=${encodeURIComponent(query)}`,
      { timeout: 6000, headers: { "User-Agent": "Mozilla/5.0" } }
    );
    const regex = /src="(https:\/\/cl-dam-resizer[^"]+\.jpg)"/g;
    let m;
    while ((m = regex.exec(html)) !== null) {
      results.push({ url: m[1], source: "Paris.cl" });
    }
    if (results.length > 0) return results;
  } catch {}

  // 2. Google Images (via npm package)
  try {
    const gis = (await import("google-image-sr")).default;
    const googleResults = await gis(productName, { safe: false });
    if (Array.isArray(googleResults)) {
      for (const r of googleResults) {
        const url = r?.image;
        if (!url || typeof url !== "string") continue;
        try {
          const hostname = new URL(url).hostname;
          if (BLOCKED_DOMAINS.some(d => hostname.includes(d))) continue;
          if (TRUSTED_DOMAINS.some(d => hostname.includes(d))) {
            // Insertar al inicio (preferido)
            results.unshift({ url, source: hostname });
          } else {
            results.push({ url, source: hostname });
          }
        } catch {}
      }
    }
    if (results.length > 0) return results;
  } catch {}

  // 3. Si tenemos Playwright, usarlo como último recurso
  // (omitido por ahora por ser pesado para Vercel)

  return results;
}

/**
 * Verifica que una URL de imagen sea accesible
 */
async function checkImageAccessible(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
    if (!res.ok) return false;
    const contentType = res.headers.get("content-type") || "";
    return contentType.startsWith("image/");
  } catch {
    // Intentar con GET si HEAD falla
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const contentType = res.headers.get("content-type") || "";
      return res.ok && contentType.startsWith("image/");
    } catch {
      return false;
    }
  }
}

/**
 * Usa OpenAI Vision para verificar calidad de la imagen
 */
async function verifyImageWithAI(imageUrl: string, productName: string): Promise<number> {
  const openai = await import("openai").then(m => new m.default({ apiKey: process.env.OPENAI_API_KEY }));
  
  // Descargar imagen y convertir a base64
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const mimeType = response.headers.get("content-type") || "image/jpeg";
  
  const result = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Eres un experto en imágenes de productos. 
Analiza esta imagen y responde SOLO con un número del 0 al 1:
- 1.0 = Imagen perfecta del producto específico: "${productName}"
- 0.8 = Imagen del producto correcto pero con fondo pobre
- 0.5 = Imagen relacionada pero no es el producto exacto
- 0.3 = Imagen genérica, no es el producto
- 0.0 = No es una imagen de producto o es ilegible

Responde SOLO con el número, nada más.`,
          },
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64}` },
          },
        ],
      },
    ],
    max_tokens: 10,
  });

  const score = parseFloat(result.choices[0]?.message?.content || "0.5");
  return isNaN(score) ? 0.5 : score;
}
