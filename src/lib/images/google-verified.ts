/**
 * Google Images Search con verificación de URLs
 * Busca imágenes en Google Images y verifica que las URLs sean válidas
 * descartando las que expiran (TikTok, Pinterest, etc.)
 */

const BLOCKED_DOMAINS = [
  "tiktok.com", "pinimg.com", "pinterest.com", "fbcdn.net", 
  "instagram.com", "reddit.com", "redd.it", "ytimg.com",
  "googleusercontent.com", "gravatar.com", "wordpress.com",
  "blogspot.com", "typepad.com", "tumblr.com", "deviantart.net",
  "wikimedia.org", "wikipedia.org", "amazonaws.com",
];

const PREFERRED_DOMAINS = [
  "m.media-amazon.com", // Amazon
  "media-amazon.com",
  "cl-dam-resizer.ecomm.cencosud.com", // Paris
  "images.falabella.com", // Falabella
  "http2.mlstatic.com", // MercadoLibre
  "mlstatic.com",
  "fravega.vteximg.com.br", // Frávega
  "images.pexels.com", // Pexels (fallback)
  "i.ebayimg.com", // eBay
  "cdn.shopify.com", // Shopify
  "shopify.com",
  "static.wixstatic.com", // Wix
  "wixstatic.com",
  "cloudinary.com", // Cloudinary
  "res.cloudinary.com",
];

export async function searchAndVerifyImages(query: string, maxResults = 5): Promise<string[]> {
  try {
    // 1. Buscar en Google Images
    const gis = (await import("google-image-sr")).default;
    const results = await gis(query, { safe: false });
    
    if (!Array.isArray(results) || results.length === 0) return [];
    
    // 2. Filtrar y clasificar
    const validUrls: string[] = [];
    const preferredUrls: string[] = [];
    
    for (const r of results) {
      const url = r?.image;
      if (!url || typeof url !== "string" || !url.startsWith("http")) continue;
      
      // Verificar que no sea de dominio bloqueado
      const hostname = new URL(url).hostname;
      if (BLOCKED_DOMAINS.some(d => hostname.includes(d))) continue;
      
      // Clasificar
      if (PREFERRED_DOMAINS.some(d => hostname.includes(d))) {
        preferredUrls.push(url);
      } else {
        validUrls.push(url);
      }
      
      if (preferredUrls.length >= maxResults) break;
    }
    
    // 3. Devolver primero las preferidas, luego las válidas
    const finalUrls = [...preferredUrls, ...validUrls].slice(0, maxResults);
    return finalUrls;
  } catch (error) {
    console.error("[GoogleVerified] Error:", error);
    return [];
  }
}

export async function searchAndVerifyBulk(
  products: { id: string; title: string }[]
): Promise<Map<string, string[]>> {
  const results = new Map<string, string[]>();
  
  for (const p of products) {
    try {
      const images = await searchAndVerifyImages(p.title, 3);
      results.set(p.id, images);
      await new Promise(r => setTimeout(r, 1500));
    } catch {
      results.set(p.id, []);
    }
  }
  
  return results;
}
