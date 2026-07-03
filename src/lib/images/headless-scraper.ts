/**
 * Headless Product Image Scraper
 * 
 * Usa Playwright + Chromium headless para renderizar sitios con JavaScript
 * y extraer imágenes reales de productos desde CUALQUIER e-commerce.
 * 
 * Fuentes principales:
 * 1. Paris.cl (HTML directo, sin JS)
 * 2. Google Images (vía Playwright)
 * 3. Falabella, Ripley, Frávega, etc. (vía Playwright)
 * 4. Amazon (vía Playwright)
 * 5. MercadoLibre (vía Playwright)
 */

import { prisma } from "@/lib/db/prisma";

// Cache de resultados para no repetir búsquedas
const cache = new Map<string, string[]>();

// Sitios a scrapear con sus selectores de imágenes
const SITES = [
  {
    name: "Paris.cl",
    url: (q: string) => `https://www.paris.cl/search?q=${encodeURIComponent(q)}`,
    // Selector CSS para las imágenes de productos en Paris
    selector: "img[src*='cl-dam-resizer']",
    // Atributo donde está la URL
    attr: "src",
    // No necesita JS
    needsJS: false,
    // Regex para extraer URLs
    regex: /src="(https:\/\/cl-dam-resizer[^"]+\.jpg)"/g,
  },
  {
    name: "Falabella Chile",
    url: (q: string) => `https://www.falabella.com/falabella-cl/search?Ntt=${encodeURIComponent(q)}&Ntk=p_${encodeURIComponent(q)}`,
    selector: "img[src*='falabella']",
    attr: "src",
    needsJS: true,
  },
  {
    name: "Ripley Chile",
    url: (q: string) => `https://simple.ripley.cl/search?q=${encodeURIComponent(q)}`,
    selector: "img[src*='ripley']",
    attr: "src",
    needsJS: true,
  },
  {
    name: "MercadoLibre",
    url: (q: string) => `https://www.mercadolibre.cl/search?q=${encodeURIComponent(q)}`,
    selector: "img[src*='mlstatic']",
    attr: "src",
    needsJS: true,
  },
  {
    name: "Amazon",
    url: (q: string) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}`,
    selector: "img[src*='media-amazon']",
    attr: "src",
    needsJS: true,
  },
  {
    name: "Best Buy",
    url: (q: string) => `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(q)}`,
    selector: "img[src*='bestbuy']",
    attr: "src",
    needsJS: true,
  },
  {
    name: "Walmart",
    url: (q: string) => `https://www.walmart.com/search?q=${encodeURIComponent(q)}`,
    selector: "img[src*='walmartimages']",
    attr: "src",
    needsJS: true,
  },
  {
    name: "eBay",
    url: (q: string) => `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q)}`,
    selector: "img[src*='ebayimg']",
    attr: "src",
    needsJS: true,
  },
];

/**
 * Busca imágenes de un producto usando scraping headless.
 * Para sitios sin JS (Paris.cl), usa HTTP directo.
 * Para sitios con JS, usa Playwright + Chromium.
 */
export async function findProductImages(
  productName: string,
  maxImages = 5
): Promise<string[]> {
  const cacheKey = `${productName}-${maxImages}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const query = productName.replace(/[^a-zA-Z0-9áéíóúñü\s-]/g, "").trim().slice(0, 60);
  if (!query) return [];

  let allImages: string[] = [];

  for (const site of SITES) {
    try {
      if (!site.needsJS) {
        // Sin JS: HTTP directo
        const axios = (await import("axios")).default;
        const { data: html } = await axios.get(site.url(query), {
          timeout: 8000,
          headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
        });

        if (site.regex) {
          const regex = site.regex;
          let m;
          while ((m = regex.exec(html)) !== null) {
            if (!allImages.includes(m[1])) allImages.push(m[1]);
          }
        }
      } else {
        // Con JS: Playwright
        const images = await scrapeWithBrowser(site.url(query), site.selector, site.attr);
        for (const img of images) {
          if (!allImages.includes(img)) allImages.push(img);
        }
      }

      if (allImages.length >= maxImages) break;
    } catch (error) {
      console.error(`[Scraper] Error ${site.name}:`, error);
    }
  }

  // Fallback: buscar en Google Images vía browser
  if (allImages.length < maxImages) {
    try {
      const googleImages = await scrapeGoogleImages(query);
      for (const img of googleImages) {
        if (!allImages.includes(img)) allImages.push(img);
      }
    } catch {}
  }

  const result = allImages.slice(0, maxImages);
  cache.set(cacheKey, result);
  return result;
}

/**
 * Scrapea imágenes de un sitio usando Playwright + Chromium headless.
 */
async function scrapeWithBrowser(
  url: string,
  selector: string,
  attr: string
): Promise<string[]> {
  try {
    const chromium = await import("playwright-core").then(m => m.chromium);
    // @ts-ignore
    const chromiumPath = await import("@sparticuz/chromium").then(m => m.default);

    const executablePath = typeof chromiumPath.executablePath === 'function'
      ? await chromiumPath.executablePath()
      : chromiumPath.executablePath;

    const browser = await chromium.launch({
      args: Array.isArray(chromiumPath.args) ? chromiumPath.args : [],
      executablePath: executablePath as string | undefined,
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(2000); // Esperar renderizado adicional

    // Extraer URLs de imágenes
    const images = await page.evaluate(
      ({ sel, at }) => {
        const elements = document.querySelectorAll(sel);
        return Array.from(elements)
          .map((el) => el.getAttribute(at) || "")
          .filter((src) => src && src.startsWith("http") && !src.includes("logo") && !src.includes("icon"))
          .slice(0, 5);
      },
      { sel: selector, at: attr }
    );

    await browser.close();
    return images;
  } catch (error) {
    console.error("[Browser] Error:", error);
    return [];
  }
}

/**
 * Scrapea Google Images usando Playwright para obtener imágenes reales.
 */
async function scrapeGoogleImages(query: string): Promise<string[]> {
  try {
    const chromium = await import("playwright-core").then(m => m.chromium);
    // @ts-ignore
    const chromiumPath = await import("@sparticuz/chromium").then(m => m.default);
    const execPath = typeof chromiumPath.executablePath === 'function'
      ? await chromiumPath.executablePath()
      : chromiumPath.executablePath;

    const browser = await chromium.launch({
      args: Array.isArray(chromiumPath.args) ? chromiumPath.args : [],
      executablePath: execPath as string | undefined,
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(
      `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`,
      { waitUntil: "networkidle", timeout: 15000 }
    );
    await page.waitForTimeout(3000);

    // Scroll para cargar más imágenes
    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(1000);

    // Extraer URLs de imágenes
    const images = await page.evaluate(() => {
      const imgs = document.querySelectorAll("img");
      return Array.from(imgs)
        .map((img) => (img as HTMLImageElement).src || "")
        .filter((src) => src.startsWith("http") && !src.includes("google") && !src.includes("logo"))
        .slice(0, 10);
    });

    await browser.close();
    return images;
  } catch (error) {
    console.error("[GoogleBrowser] Error:", error);
    return [];
  }
}

/**
 * Procesa todos los productos del catálogo buscando imágenes.
 * Se ejecuta como agente autónomo.
 */
export async function huntAllProducts(): Promise<{
  total: number;
  updated: number;
  errors: number;
}> {
  console.log("[ProductScraper] Iniciando búsqueda masiva de imágenes...\n");

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, title: true },
  });

  let updated = 0;
  let errors = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    process.stdout.write(`[${i + 1}/${products.length}] ${p.title.slice(0, 40).padEnd(42)}`);

    try {
      const images = await findProductImages(p.title, 3);
      if (images.length > 0) {
        await prisma.product.update({
          where: { id: p.id },
          data: { thumbnail: images[0], images },
        });
        console.log("✅");
        updated++;
      } else {
        console.log("⬜ Sin imágenes");
      }
    } catch (error) {
      errors++;
      console.log("❌ Error");
    }
  }

  console.log(`\n✅ Actualizados: ${updated}/${products.length} (Errores: ${errors})`);
  return { total: products.length, updated, errors };
}
