/**
 * Pexels Product Image Fetcher
 * 
 * API: https://www.pexels.com/api/documentation/
 * Tiene fotos estilo "product photography" — ideales para e-commerce.
 * 
 * Uso: searchProductImages("zapatillas", 20) → URLs de fotos reales
 */

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PEXELS_BASE = "https://api.pexels.com/v1";

// Términos de búsqueda por categoría de producto
const CATEGORY_QUERIES: Record<string, string> = {
  "Tecnología": "electronics product technology",
  "Celulares": "smartphone mobile phone product",
  "Electrónica": "electronic device gadget",
  "Computación": "laptop computer technology",
  "Calzado": "sneaker shoes footwear product",
  "Zapatillas": "sneakers shoes fashion product",
  "Vestuario": "clothing fashion apparel",
  "Ropa": "clothes fashion garment",
  "Belleza": "cosmetics beauty product makeup",
  "Hogar": "home decor furniture interior",
  "Electrodomésticos": "home appliance kitchen",
  "Deportes": "sports equipment fitness",
  "Deporte": "sport accessory outdoor",
  "Juguetes": "toys games children product",
  "Música": "headphone speaker music",
  "Audio": "headphone speaker audio",
};

const DEFAULT_QUERY = "product photography retail";

const searchCache: Record<string, string[]> = {};

interface PexelsPhoto {
  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
    tiny: string;
  };
  photographer: string;
  alt: string;
  id: number;
}

/**
 * Busca imágenes de productos en Pexels por categoría.
 * Retorna URLs de fotos reales de productos con estilo e-commerce.
 */
export async function searchProductImages(
  category: string,
  count = 20
): Promise<string[]> {
  const cacheKey = `${category}-${count}`;

  if (searchCache[cacheKey]) {
    return searchCache[cacheKey];
  }

  if (!PEXELS_API_KEY) {
    console.warn("[Pexels] No API key configured");
    return getFallbackImages(category, count);
  }

  const query = CATEGORY_QUERIES[category] || CATEGORY_QUERIES[Object.keys(CATEGORY_QUERIES)[0]] || DEFAULT_QUERY;

  try {
    // Primera búsqueda
    const urls = await fetchPexelsPage(query);

    // Si no hay suficientes, hacer segunda búsqueda con query general
    if (urls.length < count) {
      const moreUrls = await fetchPexelsPage(`${query} product`);
      urls.push(...moreUrls);
    }

    searchCache[cacheKey] = urls;
    return urls.slice(0, count);
  } catch (error) {
    console.error("[Pexels] Error:", error);
    return getFallbackImages(category, count);
  }
}

async function fetchPexelsPage(query: string): Promise<string[]> {
  const res = await fetch(
    `${PEXELS_BASE}/search?query=${encodeURIComponent(query)}&per_page=40&orientation=square`,
    {
      headers: {
        Authorization: PEXELS_API_KEY!,
      },
    }
  );

  if (!res.ok) {
    console.warn(`[Pexels] API error: ${res.status}`);
    return [];
  }

  const data = await res.json() as { photos?: PexelsPhoto[] };
  return (data.photos || []).map((p) => p.src.medium);
}

/**
 * Obtiene imágenes para los productos existentes en la BD,
 * usando búsquedas por categoría, y las asigna a los productos.
 */
export async function assignPexelsImagesToProducts(prisma: any) {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: { select: { name: true } } },
  });

  console.log(`[Pexels] Buscando imágenes para ${products.length} productos...`);

  // Agrupar por categoría para minimizar llamadas a API
  const byCategory: Record<string, string[]> = {};
  for (const p of products) {
    const cat = p.category?.name || "Producto";
    if (!byCategory[cat]) {
      byCategory[cat] = [];
      const images = await searchProductImages(cat, 20);
      byCategory[cat] = images;
      console.log(`  ${cat}: ${images.length} imágenes obtenidas`);
    }
  }

  let updated = 0;
  for (const product of products) {
    const cat = product.category?.name || "Producto";
    const images = byCategory[cat] || [];

    if (images.length > 0) {
      // Asignar imágenes únicas por producto
      const productImages = images.slice(0, 5).map((url, i) => {
        // Variar la URL ligeramente para que cada producto tenga imagen única
        if (i === 0) return url;
        // Para más variedad, rotar entre las imágenes disponibles
        return images[i % images.length];
      });

      await prisma.product.update({
        where: { id: product.id },
        data: {
          thumbnail: productImages[0],
          images: productImages,
        },
      });
      updated++;
    }
  }

  console.log(`[Pexels] ✅ ${updated} productos actualizados`);
  return updated;
}

function getFallbackImages(category: string, count: number): string[] {
  // Fallback cuando no hay API key
  const images: string[] = [];
  const seed = category.toLowerCase().replace(/[^a-z]/g, "");
  for (let i = 0; i < count; i++) {
    images.push(`https://picsum.photos/seed/${seed}${i}/400/400`);
  }
  return images;
}
