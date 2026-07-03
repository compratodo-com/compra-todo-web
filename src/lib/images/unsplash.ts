/**
 * Unsplash Image Fetcher
 * Obtiene imágenes reales de alta calidad categorizadas por tipo de producto.
 * Ideal para el catálogo mientras conseguimos API de MercadoLibre.
 */

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

// Colecciones curadas de Unsplash con fotos de productos reales
const PRODUCT_COLLECTIONS: Record<string, string> = {
  "Tecnología": "https://api.unsplash.com/search/photos?query=technology-product&orientation=squarish&per_page=30",
  "Celulares": "https://api.unsplash.com/search/photos?query=smartphone-product&orientation=squarish&per_page=30",
  "Zapatillas": "https://api.unsplash.com/search/photos?query=sneakers-shoes&orientation=squarish&per_page=30",
  "Calzado": "https://api.unsplash.com/search/photos?query=shoes-fashion&orientation=squarish&per_page=30",
  "Vestuario": "https://api.unsplash.com/search/photos?query=clothing-fashion&orientation=squarish&per_page=30",
  "Ropa": "https://api.unsplash.com/search/photos?query=clothing-apparel&orientation=squarish&per_page=30",
  "Belleza": "https://api.unsplash.com/search/photos?query=beauty-cosmetics&orientation=squarish&per_page=30",
  "Hogar": "https://api.unsplash.com/search/photos?query=home-decor&orientation=squarish&per_page=30",
  "Deportes": "https://api.unsplash.com/search/photos?query=sports-equipment&orientation=squarish&per_page=30",
  "Deporte": "https://api.unsplash.com/search/photos?query=sport-accessories&orientation=squarish&per_page=30",
  "Juguetes": "https://api.unsplash.com/search/photos?query=toys-games&orientation=squarish&per_page=30",
  "Electrodomésticos": "https://api.unsplash.com/search/photos?query=appliances-home&orientation=squarish&per_page=30",
};

const DEFAULT_COLLECTION = "https://api.unsplash.com/search/photos?query=product-showcase&orientation=squarish&per_page=30";

// Cache de URLs por categoría (para no llamar a Unsplash cada vez)
const imageCache: Record<string, string[]> = {};

interface UnsplashPhoto {
  urls: { regular: string; small: string; thumb: string };
  alt_description: string | null;
  id: string;
}

export async function getImagesForCategory(
  categoryName: string,
  count = 20
): Promise<string[]> {
  const cacheKey = categoryName.toLowerCase();

  // Usar caché si está disponible
  if (imageCache[cacheKey] && imageCache[cacheKey].length >= count) {
    return imageCache[cacheKey].slice(0, count);
  }

  // Si hay caché pero insuficiente, devolver lo que hay
  if (imageCache[cacheKey]) {
    return imageCache[cacheKey];
  }

  if (!UNSPLASH_ACCESS_KEY) {
    return getFallbackImages(categoryName, count);
  }

  try {
    // Buscar imágenes en Unsplash
    const searchUrl = PRODUCT_COLLECTIONS[cacheKey] || PRODUCT_COLLECTIONS[categoryName] || DEFAULT_COLLECTION;
    
    const res = await fetch(searchUrl, {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });

    if (!res.ok) {
      console.warn(`[Unsplash] API error: ${res.status}`);
      return getFallbackImages(categoryName, count);
    }

    const data = await res.json() as { results?: UnsplashPhoto[] };
    const images = (data.results || []).map((p) => p.urls.regular);

    imageCache[cacheKey] = images;
    return images.slice(0, count);
  } catch (error) {
    console.warn("[Unsplash] Error:", error);
    return getFallbackImages(categoryName, count);
  }
}

/**
 * Fallback: imágenes de alta calidad de fuentes públicas gratuitas.
 * No requiere API key. Usan Lorem Picsum (servicio de Unsplash).
 */
function getFallbackImages(categoryName: string, count = 20): string[] {
  const seed = categoryName.toLowerCase().replace(/[^a-z]/g, "");
  const images: string[] = [];
  
  // Usar picsum.photos (servicio gratuito de imágenes reales)
  for (let i = 0; i < count; i++) {
    images.push(`https://picsum.photos/seed/${seed}${i}/400/400`);
  }
  
  return images;
}

/**
 * Reemplaza las imágenes de todos los productos en la BD con imágenes reales
 * de Unsplash según su categoría.
 */
export async function updateProductImagesInDB(prisma: any) {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: { select: { name: true } } },
  });

  console.log(`[Images] Actualizando imágenes de ${products.length} productos...`);

  let updated = 0;
  for (const product of products) {
    const catName = product.category?.name || "Tecnología";
    const images = await getImagesForCategory(catName, 5);
    
    if (images.length > 0) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          thumbnail: images[0],
          images: images,
        },
      });
      updated++;
    }
  }

  console.log(`[Images] ✅ ${updated} productos actualizados con imágenes reales`);
  return updated;
}
