/**
 * Image Hunter Pro
 *
 * Para cada producto que lo necesita:
 *   1. Junta candidatos de varias fuentes (Paris.cl + Google Images).
 *   2. Suma la imagen ACTUAL como candidata (para no empeorarla).
 *   3. Filtra banners/logos/stock con heurísticas gratis.
 *   4. Verifica los mejores candidatos con Groq Vision y elige el de mayor puntaje.
 *   5. Solo reemplaza si encontró algo que supera el umbral (si no, deja lo que había).
 *
 * Guarda la URL externa directa (hotlink), que es lo que funciona en Vercel sin
 * Blob token. Si en el futuro se configura BLOB_READ_WRITE_TOKEN, se puede volver
 * a descargar vía uploadProductImages.
 */

import { prisma } from "@/lib/db/prisma";
import { pickBestVerifiedImage, type ImageCandidate } from "@/lib/images/verify";

// Dominios de e-commerce confiables — se priorizan como candidatos.
const TRUSTED_DOMAINS = [
  "cl-dam-resizer.ecomm.cencosud.com",
  "http2.mlstatic.com",
  "mlstatic.com",
  "m.media-amazon.com",
  "media-amazon.com",
  "i.ebayimg.com",
  "cdn.shopify.com",
  "falabella.com",
  "images.falabella.com",
  "vteximg.com.br",
  "cloudinary.com",
  "res.cloudinary.com",
];

const BLOCKED_DOMAINS = [
  "tiktok.com", "pinimg.com", "pinterest.com", "fbcdn.net",
  "instagram.com", "reddit.com", "redd.it", "ytimg.com",
  "googleusercontent.com", "gravatar.com",
];

// Fuentes que consideramos ya confiables: no las reprocesamos salvo `force`.
const RELIABLE_HOSTS = [
  "mlstatic.com",
  "cl-dam-resizer.ecomm.cencosud.com",
];

interface HuntOptions {
  /** Máx. de productos a procesar en esta corrida (acota tiempo/rate limits). */
  maxProducts?: number;
  /** Reprocesar todos, incluso los que ya tienen imagen de fuente confiable. */
  force?: boolean;
  /** Puntaje mínimo para aceptar una imagen nueva. */
  minScore?: number;
  /** Simula sin escribir en la base: solo reporta qué cambiaría. */
  dryRun?: boolean;
}

/** Un producto necesita mejor imagen si no tiene, o si su fuente no es confiable. */
function needsBetterImage(thumbnail: string | null): boolean {
  if (!thumbnail) return true;
  try {
    const host = new URL(thumbnail).hostname;
    return !RELIABLE_HOSTS.some((d) => host.includes(d));
  } catch {
    return true;
  }
}

interface ImageChange {
  title: string;
  score: number | null;
  source: string;
  before: string | null;
  after: string;
}

export async function huntProductImagesPro(opts: HuntOptions = {}): Promise<{
  total: number;
  processed: number;
  updated: number;
  skipped: number;
  errors: number;
  dryRun: boolean;
  changes: ImageChange[];
}> {
  const { maxProducts = 20, force = false, minScore = 0.6, dryRun = false } = opts;
  console.log(`[ImageHunterPro] 🎯 Verificando imágenes con Groq Vision${dryRun ? " (DRY-RUN, sin escribir)" : ""}...\n`);

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, title: true, brand: true, thumbnail: true },
  });

  const targets = (force ? products : products.filter((p) => needsBetterImage(p.thumbnail)))
    .slice(0, maxProducts);

  let updated = 0;
  let skipped = 0;
  let errors = 0;
  const changes: ImageChange[] = [];

  for (let i = 0; i < targets.length; i++) {
    const p = targets[i];
    process.stdout.write(`[${i + 1}/${targets.length}] ${p.title.slice(0, 40).padEnd(42)}`);

    try {
      const scraped = await searchAllSources(p.title, p.brand);

      // La imagen actual entra como candidata: si sigue siendo la mejor, se conserva.
      const candidates: ImageCandidate[] = [];
      if (p.thumbnail) candidates.push({ url: p.thumbnail, source: "actual" });
      candidates.push(...scraped);

      const best = await pickBestVerifiedImage(candidates, p.title, p.brand, {
        minScore,
        incumbentUrl: p.thumbnail,
      });

      if (!best) {
        skipped++;
        console.log("⬜ Sin candidato válido");
        continue;
      }

      if (best.url === p.thumbnail) {
        skipped++;
        console.log(`✅ Conserva actual (${best.score?.toFixed(2) ?? "heur"})`);
        continue;
      }

      if (!dryRun) {
        await prisma.product.update({
          where: { id: p.id },
          data: { thumbnail: best.url, images: [best.url] },
        });
      }
      updated++;
      changes.push({
        title: p.title,
        score: best.score ?? null,
        source: best.source,
        before: p.thumbnail,
        after: best.url,
      });
      console.log(`${dryRun ? "📝 CAMBIARÍA" : "✅ Nueva imagen"} (${best.score?.toFixed(2) ?? "heur"}) ${best.source}`);
      if (dryRun) {
        console.log(`     antes: ${p.thumbnail ?? "(sin imagen)"}`);
        console.log(`     nueva: ${best.url}`);
      }
    } catch (error) {
      errors++;
      console.log("❌ Error");
    }
  }

  console.log(`\n[ImageHunterPro] 📊 Resumen:
   Candidatos a revisar: ${targets.length} de ${products.length}
   Actualizados: ${updated}
   Conservados/sin cambio: ${skipped}
   Errores: ${errors}`);

  return {
    total: products.length,
    processed: targets.length,
    updated,
    skipped,
    errors,
    dryRun,
    changes,
  };
}

/**
 * Junta candidatos de imágenes de varias fuentes, con los dominios confiables
 * al frente. NO retorna antes de tiempo: queremos varias opciones para que el
 * verificador elija.
 */
async function searchAllSources(
  productName: string,
  brand?: string | null
): Promise<ImageCandidate[]> {
  const query = [brand, productName].filter(Boolean).join(" ");
  const trusted: ImageCandidate[] = [];
  const rest: ImageCandidate[] = [];

  // 1. Paris.cl (rápido, sin JS)
  try {
    const axios = (await import("axios")).default;
    const q = query.replace(/[^a-zA-Z0-9áéíóúñü\s-]/g, "").trim().slice(0, 60);
    const { data: html } = await axios.get(
      `https://www.paris.cl/search?q=${encodeURIComponent(q)}`,
      { timeout: 6000, headers: { "User-Agent": "Mozilla/5.0" } }
    );
    const regex = /src="(https:\/\/cl-dam-resizer[^"]+\.jpg)"/g;
    let m;
    while ((m = regex.exec(html)) !== null) {
      trusted.push({ url: m[1], source: "Paris.cl" });
    }
  } catch {}

  // 2. Google Images (via npm). Solo si Paris trajo poco, para acotar latencia.
  if (trusted.length < 3) {
    try {
      const gis = (await import("google-image-sr")).default;
      const googleResults = await gis(query, { safe: false });
      if (Array.isArray(googleResults)) {
        for (const r of googleResults) {
          const url = (r as any)?.image;
          if (!url || typeof url !== "string") continue;
          let host: string;
          try {
            host = new URL(url).hostname;
          } catch {
            continue;
          }
          if (BLOCKED_DOMAINS.some((d) => host.includes(d))) continue;
          const cand = { url, source: host };
          if (TRUSTED_DOMAINS.some((d) => host.includes(d))) {
            trusted.push(cand);
          } else {
            rest.push(cand);
          }
        }
      }
    } catch {}
  }

  return [...trusted, ...rest];
}
