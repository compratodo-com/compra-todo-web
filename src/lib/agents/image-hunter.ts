/**
 * Image Hunter Agent
 * Busca imágenes reales de productos en Google Images automáticamente.
 * No necesita API key — usa scraping inteligente de Google.
 * 
 * Se ejecuta como parte del ciclo de agentes autónomos.
 */

import { prisma } from "@/lib/db/prisma";
import { uploadProductImages } from "@/lib/images/storage";

interface ImageResult {
  title: string;
  url: string;
  image: string;
}

export async function huntProductImages(): Promise<{
  total: number;
  updated: number;
  fromGoogle: number;
  fromParis: number;
  errors: number;
}> {
  console.log("[ImageHunter] 🎯 Buscando imágenes reales para productos...");

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, title: true, externalId: true, thumbnail: true },
  });

  let updated = 0;
  let fromGoogle = 0;
  let fromParis = 0;
  let errors = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    process.stdout.write(`[${i + 1}/${products.length}] ${p.title.slice(0, 40).padEnd(42)}`);

    try {
      // 1. Intentar Paris.cl primero (imagen exacta del producto)
      const parisImage = await searchParis(p.title);
      if (parisImage) {
        await prisma.product.update({
          where: { id: p.id },
          data: { thumbnail: parisImage, images: [parisImage] },
        });
        fromParis++;
        updated++;
        console.log("✅ Paris.cl");
        continue;
      }

      // 2. Si no, buscar en Google Images
      await new Promise(r => setTimeout(r, 1500)); // Pausa entre requests
      const googleImages = await searchGoogleImages(p.title);
      if (googleImages.length > 0) {
        // Subir la imagen a nuestro storage
        const uploaded = await uploadProductImages(
          [googleImages[0].image],
          p.externalId
        );
        const imageUrl = uploaded[0] || googleImages[0].image;
        await prisma.product.update({
          where: { id: p.id },
          data: { thumbnail: imageUrl, images: [imageUrl, ...googleImages.slice(1, 3).map(g => g.image)] },
        });
        fromGoogle++;
        updated++;
        console.log("✅ Google Images");
      } else {
        console.log("⬜ Sin resultados");
      }
    } catch (error) {
      errors++;
      console.log("❌ Error");
    }
  }

  console.log(`\n[ImageHunter] 📊 Resumen:`);
  console.log(`   Paris.cl: ${fromParis} productos`);
  console.log(`   Google Images: ${fromGoogle} productos`);
  console.log(`   Total actualizados: ${updated}`);
  console.log(`   Errores: ${errors}`);

  return { total: products.length, updated, fromGoogle, fromParis, errors };
}

async function searchParis(productName: string): Promise<string | null> {
  try {
    const axios = (await import("axios")).default;
    const query = productName.replace(/[^a-zA-Z0-9áéíóúñü\s-]/g, "").trim().slice(0, 60);
    const { data: html } = await axios.get(
      `https://www.paris.cl/search?q=${encodeURIComponent(query)}`,
      { timeout: 6000, headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" } }
    );
    const regex = /src="(https:\/\/cl-dam-resizer[^"]+\.jpg)"/g;
    const images: string[] = [];
    let m;
    while ((m = regex.exec(html)) !== null) {
      if (!images.includes(m[1])) images.push(m[1]);
    }
    return images[0] || null;
  } catch {
    return null;
  }
}

async function searchGoogleImages(query: string): Promise<ImageResult[]> {
  try {
    const gis = (await import("google-image-sr")).default;
    const results = await gis(query, { safe: false });
    if (!results || !Array.isArray(results)) return [];
    
    // Filtrar resultados válidos con URLs de imágenes reales
    return results
      .filter((r: any) => {
        if (!r.image || typeof r.image !== "string") return false;
        const url = r.image;
        // Excluir placeholders, thumbnails diminutos, etc.
        if (url.includes("placeholder") || url.includes("thumbnail")) return false;
        return url.startsWith("http");
      })
      .slice(0, 5);
  } catch (error) {
    console.error("[GoogleImages] Error:", error);
    return [];
  }
}
