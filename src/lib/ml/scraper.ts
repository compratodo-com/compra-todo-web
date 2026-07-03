/**
 * Scraper de MercadoLibre Chile
 * Extrae productos reales con imágenes desde las páginas públicas.
 * No necesita API key — funciona con scraping HTML.
 */

import axios from "axios";

const CHILE_URLS = [
  "https://www.mercadolibre.cl/ofertas",
  "https://www.mercadolibre.cl/mas-vendidos",
  "https://www.mercadolibre.cl/tienda-oficial/mercado-credito",
];

// Categorías top para buscar productos
const CATEGORY_URLS = [
  { name: "Celulares", url: "https://listado.mercadolibre.cl/celulares-telefonia/celulares-smartphones/" },
  { name: "Zapatillas", url: "https://listado.mercadolibre.cl/zapatillas/" },
  { name: "Electrónica", url: "https://listado.mercadolibre.cl/electronica-audio-video/" },
  { name: "Computación", url: "https://listado.mercadolibre.cl/computacion/" },
  { name: "Belleza", url: "https://listado.mercadolibre.cl/belleza-cuidado-personal/" },
  { name: "Hogar", url: "https://listado.mercadolibre.cl/hogar-muebles-jardin/" },
  { name: "Deportes", url: "https://listado.mercadolibre.cl/deportes-fitness/" },
  { name: "Juguetes", url: "https://listado.mercadolibre.cl/juguetes/" },
  { name: "Vestuario", url: "https://listado.mercadolibre.cl/vestuario-bolsos/" },
];

export interface ScrapedProduct {
  title: string;
  price: number;
  originalPrice: number | null;
  image: string;
  url: string;
  category: string;
  seller: string | null;
}

const client = axios.create({
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "es-CL,es;q=0.9",
  },
});

/**
 * Scrapea productos reales desde una página de listado de MercadoLibre.
 */
export async function scrapeCategoryProducts(
  categoryUrl: string,
  categoryName: string,
  maxProducts = 20
): Promise<ScrapedProduct[]> {
  try {
    const { data: html } = await client.get(categoryUrl);
    const products = parseProductHTML(html, categoryName);
    return products.slice(0, maxProducts);
  } catch (error) {
    console.error(`[MLScraper] Error scraping ${categoryName}:`, error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * Scrapea productos de TODAS las categorías principales.
 */
export async function scrapeAllCategories(
  productsPerCategory = 15
): Promise<ScrapedProduct[]> {
  const all: ScrapedProduct[] = [];
  const seen = new Set<string>();

  for (const cat of CATEGORY_URLS) {
    try {
      const products = await scrapeCategoryProducts(cat.url, cat.name, productsPerCategory);
      for (const p of products) {
        const key = p.title.toLowerCase().slice(0, 30);
        if (!seen.has(key)) {
          all.push(p);
          seen.add(key);
        }
      }
      console.log(`[MLScraper] ${cat.name}: ${products.length} productos`);
      await sleep(1000); // Esperar entre peticiones para no ser bloqueado
    } catch (error) {
      console.error(`[MLScraper] Failed category ${cat.name}:`, error);
    }
  }

  return all;
}

function parseProductHTML(html: string, categoryName: string): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];

  try {
    // Buscar el JSON-LD con los datos de productos (schema.org)
    const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
    let match;
    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]);
        if (data["@type"] === "Product" || data["@type"] === "ItemList") {
          const items = data["@type"] === "ItemList" ? data.itemListElement?.map((i: any) => i.item) : [data];
          for (const item of items) {
            if (item && item.name && item.offers) {
              const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
              products.push({
                title: item.name,
                price: offer?.price || 0,
                originalPrice: null,
                image: item.image || (Array.isArray(item.image) ? item.image[0] : item.image) || "",
                url: item.url || "",
                category: categoryName,
                seller: item.brand?.name || item.seller?.name || null,
              });
            }
          }
        }
      } catch {}
    }

    // Fallback: parsear desde HTML directo si no hay JSON-LD
    if (products.length === 0) {
      const itemRegex = /<div[^>]*class="[^"]*ui-search-result[^"]*"[^>]*>/g;
      const items: string[] = [];
      let itemMatch;
      while ((itemMatch = itemRegex.exec(html)) !== null) {
        const start = itemMatch.index;
        const end = html.indexOf("</div>", start) + 6;
        // Buscar el cierre correcto
        let depth = 1;
        let pos = start + itemMatch[0].length;
        while (depth > 0 && pos < html.length) {
          if (html.indexOf("<div", pos) === pos) { depth++; pos += 4; }
          else if (html.indexOf("</div>", pos) === pos) { depth--; pos += 6; }
          else pos++;
        }
        items.push(html.slice(start, pos));
      }

      for (const itemHtml of items.slice(0, 50)) {
        try {
          const title = extractText(itemHtml, "ui-search-item__title") ||
                       extractText(itemHtml, "ui-search-link__title");
          const priceStr = extractText(itemHtml, "andes-money-amount__fraction");
          const imgMatch = itemHtml.match(/<img[^>]*src="([^"]*)"[^>]*>/);
          const price = priceStr ? parseInt(priceStr.replace(/\./g, "")) : 0;

          if (title && price > 0 && imgMatch) {
            products.push({
              title,
              price,
              originalPrice: null,
              image: imgMatch[1].startsWith("http") ? imgMatch[1] : `https:${imgMatch[1]}`,
              url: "",
              category: categoryName,
              seller: null,
            });
          }
        } catch {}
      }
    }
  } catch (error) {
    console.error("[MLScraper] Parse error:", error);
  }

  return products;
}

function extractText(html: string, className: string): string | null {
  // Buscar por clase
  const regex = new RegExp(`class="[^"]*${className}[^"]*"[^>]*>([^<]*)`, "i");
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getRealProducts(count = 50): Promise<ScrapedProduct[]> {
  console.log("[MLScraper] Obteniendo productos reales desde MercadoLibre Chile...\n");
  
  const products = await scrapeAllCategories(Math.ceil(count / CATEGORY_URLS.length));
  
  console.log(`\n[MLScraper] Total: ${products.length} productos reales obtenidos`);
  
  if (products.length > 0) {
    console.log("\nEjemplos:");
    products.slice(0, 5).forEach(p => {
      console.log(`  - ${p.title.slice(0, 50)}: $${p.price.toLocaleString("es-CL")} [${p.category}]`);
    });
  }
  
  return products;
}
