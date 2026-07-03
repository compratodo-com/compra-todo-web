import axios from "axios";

const ML_API_BASE = "https://api.mercadolibre.com";
const ML_SITE = "MLC";

// Categorías top de Chile con sus IDs de MercadoLibre
export const TOP_CATEGORIES = [
  { id: "MLC1051", name: "Celulares y Smartphones" },
  { id: "MLC1000", name: "Electrónica" },
  { id: "MLC1648", name: "Computación" },
  { id: "MLC1132", name: "Zapatillas" },
  { id: "MLC1430", name: "Ropa y Accesorios" },
  { id: "MLC1247", name: "Belleza y Cuidado Personal" },
  { id: "MLC1574", name: "Hogar y Decoración" },
  { id: "MLC1384", name: "Deportes" },
  { id: "MLC1196", name: "Juguetes" },
  { id: "MLC1140", name: "Electrodomésticos" },
];

const client = axios.create({
  baseURL: ML_API_BASE,
  timeout: 15000,
  headers: {
    "User-Agent": "CompraTodo/1.0 (autonomous-shopping-simulator)",
    Accept: "application/json",
  },
});

export interface MLProduct {
  id: string;
  title: string;
  price: number;
  original_price: number | null;
  currency_id: string;
  available_quantity: number;
  sold_quantity: number;
  condition: string;
  pictures: Array<{ id: string; url: string; secure_url: string }>;
  thumbnail: string;
  category_id: string;
  catalog_product_id?: string;
  attributes: Array<{ id: string; name: string; value_name: string | null }>;
  shipping: { free_shipping: boolean; logistic_type: string | null };
  tags: string[];
  listing_type_id: string;
  seller: { id: number; nickname: string };
}

export interface MLSearchResponse {
  results: MLProduct[];
  paging: { total: number; offset: number; limit: number };
  filters: Array<{
    id: string;
    name: string;
    values: Array<{ id: string; name: string; results: number }>;
  }>;
}

/**
 * Busca productos trending desde MercadoLibre Chile.
 * Ordena por más vendidos y aplica filtros para obtener productos de calidad.
 */
export async function searchTrendingProducts(
  options: {
    categoryId?: string;
    limit?: number;
    offset?: number;
    minSold?: number;
    query?: string;
  } = {}
): Promise<MLProduct[]> {
  const { categoryId, limit = 50, offset = 0, minSold = 10 } = options;

  const params: Record<string, string | number> = {
    site: ML_SITE,
    limit,
    offset,
    sort: "sold_quantity_desc",
    // Filtros de calidad: productos con fotos reales, buen estado
    condition: "new",
  };

  if (categoryId) {
    params.category = categoryId;
  }
  if (options.query) {
    params.q = options.query;
  }

  try {
    const { data } = await client.get<MLSearchResponse>("/sites/MLC/search", {
      params,
    });

    let products = data.results || [];

    // Filtrar por cantidad mínima de ventas
    if (minSold > 0) {
      products = products.filter((p) => p.sold_quantity >= minSold);
    }

    // Filtrar productos sin imágenes
    products = products.filter(
      (p) => p.pictures && p.pictures.length > 0
    );

    return products;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        `[ML] API error: ${error.response?.status} - ${error.message}`
      );
      if (error.response?.status === 429) {
        console.warn("[ML] Rate limited, backing off...");
        await sleep(5000);
      }
    } else {
      console.error("[ML] Error searching products:", error);
    }
    return [];
  }
}

/**
 * Busca productos trending de TODAS las categorías principales.
 */
export async function searchAllTrendingCategories(
  productsPerCategory = 20,
  minSold = 50
): Promise<MLProduct[]> {
  const allProducts: MLProduct[] = [];
  const seen = new Set<string>();

  // Primero, buscar lo más vendido general
  const general = await searchTrendingProducts({
    limit: 50,
    minSold: 100,
  });
  for (const p of general) {
    if (!seen.has(p.id)) {
      allProducts.push(p);
      seen.add(p.id);
    }
  }

  // Luego, buscar por cada categoría top
  for (const cat of TOP_CATEGORIES) {
    try {
      const categoryProducts = await searchTrendingProducts({
        categoryId: cat.id,
        limit: productsPerCategory,
        minSold,
      });

      for (const p of categoryProducts) {
        if (!seen.has(p.id)) {
          allProducts.push(p);
          seen.add(p.id);
        }
      }

      // Pequeña pausa para evitar rate limiting
      await sleep(300);
    } catch (error) {
      console.error(`[ML] Error searching category ${cat.name}:`, error);
    }
  }

  return allProducts;
}

/**
 * Obtiene la descripción de un producto desde MercadoLibre.
 */
export async function getProductDescription(
  productId: string
): Promise<string> {
  try {
    const { data } = await client.get(`/items/${productId}/description`);
    return data.plain_text || "";
  } catch {
    return "";
  }
}

/**
 * Obtiene detalle completo de un producto (incluye pictures con URLs grandes).
 */
export async function getProductDetail(
  productId: string
): Promise<MLProduct | null> {
  try {
    const { data } = await client.get(`/items/${productId}`);
    return data;
  } catch {
    return null;
  }
}

/**
 * Obtiene el top de productos más vendidos en Chile ahora.
 */
export async function getTopSellingInChile(
  limit = 50
): Promise<MLProduct[]> {
  return searchTrendingProducts({ limit, minSold: 200 });
}

/**
 * Obtiene productos que están subiendo en ventas (tendencia).
 * Busca con offset aleatorio para no siempre obtener los mismos.
 */
export async function getRisingTrends(
  count = 30
): Promise<MLProduct[]> {
  const allProducts: MLProduct[] = [];
  const seen = new Set<string>();

  // Múltiples búsquedas con queries generales para capturar tendencias
  const queries = [
    "",           // General
    "nuevo",      // Productos nuevos
    "2025",       // Modelos recientes
    "original",   // Artículos originales
  ];

  for (const q of queries) {
    const products = await searchTrendingProducts({
      query: q,
      limit: 30,
      minSold: 5, // Más permisivo para capturar tendencias emergentes
    });

    for (const p of products) {
      if (!seen.has(p.id)) {
        allProducts.push(p);
        seen.add(p.id);
      }
    }

    await sleep(400);
  }

  // Ordenar por más vendidos y limitar
  return allProducts
    .sort((a, b) => b.sold_quantity - a.sold_quantity)
    .slice(0, count);
}

/**
 * Extrae el brand del producto desde sus atributos.
 */
export function extractBrand(product: MLProduct): string | null {
  const brandAttr = product.attributes?.find(
    (a) => a.id === "BRAND" || a.name.toLowerCase() === "marca"
  );
  return brandAttr?.value_name || null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
