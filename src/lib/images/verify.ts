/**
 * Verificación y selección de imágenes de producto.
 *
 * Dos capas:
 *  1. Heurísticas gratis (sin red): descartan banners, logos y stock genérico
 *     mirando solo la URL. Matan los casos más groseros sin gastar tokens.
 *  2. Groq Vision (Llama 4 Scout): puntúa 0..1 qué tan bien la imagen
 *     representa al producto. Compatible con el SDK `openai` (solo cambia
 *     baseURL + apiKey), así que no agrega dependencias.
 *
 * Si no hay GROQ_API_KEY, se cae con gracia a solo-heurísticas.
 */

export interface ImageCandidate {
  url: string;
  source: string;
  /** Puntaje asignado por la verificación (se rellena en pickBestVerifiedImage). */
  score?: number;
}

// Palabras en la URL que delatan que NO es una foto de producto.
const BANNER_HINTS = [
  "banner", "cta", "hero", "promo", "header", "footer", "logo", "sprite",
  "placeholder", "spacer", "blank", "pixel", "no-image", "noimage",
  "sin-imagen", "default", "not-found", "error",
];

// Dominios de stock/genéricos: nunca traen EL producto real.
const GENERIC_DOMAINS = [
  "images.pexels.com", "pexels.com",
  "picsum.photos",
  "images.unsplash.com", "unsplash.com",
];

/** La URL parece un banner/CTA/logo en vez de una foto de producto. */
export function looksLikeBanner(url: string): boolean {
  const u = url.toLowerCase();
  return BANNER_HINTS.some((h) => u.includes(h));
}

/** La URL viene de un banco de imágenes genérico (stock), no del producto real. */
export function isGenericStock(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return GENERIC_DOMAINS.some((d) => host.includes(d));
  } catch {
    return false;
  }
}

/** Descarta candidatos que las heurísticas marcan como no-producto. */
export function filterCandidates(candidates: ImageCandidate[]): ImageCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((c) => {
    if (!c.url || !c.url.startsWith("http")) return false;
    if (seen.has(c.url)) return false;
    seen.add(c.url);
    if (looksLikeBanner(c.url)) return false;
    if (isGenericStock(c.url)) return false;
    return true;
  });
}

const GROQ_BASE = "https://api.groq.com/openai/v1";
const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB

/** Marca un fallo al DESCARGAR la imagen (distinto de "Groq no disponible"). */
export class ImageFetchError extends Error {}

/**
 * Descarga la imagen nosotros mismos (siguiendo redirects, con UA de navegador)
 * y la devuelve como data URL base64. Así evitamos que el fetcher de Groq falle
 * por redirects/hotlink. Retorna null si no se pudo bajar.
 */
async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const ct = (res.headers.get("content-type") || "").split(";")[0];
    if (!ct.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > MAX_IMAGE_BYTES) return null;
    return `data:${ct};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * Puntúa con Groq Vision qué tan bien la imagen representa al producto.
 * Retorna 0..1. Devuelve -1 si Groq no está disponible (sin API key).
 * Lanza ImageFetchError si no se pudo descargar la imagen (candidato a saltar).
 */
export async function scoreImageWithGroq(
  imageUrl: string,
  productTitle: string,
  brand?: string | null
): Promise<number> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return -1;

  const dataUrl = await fetchImageAsDataUrl(imageUrl);
  if (!dataUrl) throw new ImageFetchError("no se pudo descargar la imagen");

  const OpenAI = (await import("openai")).default;
  const groq = new OpenAI({ apiKey, baseURL: GROQ_BASE });

  const label = brand ? `${brand} ${productTitle}` : productTitle;

  const res = await groq.chat.completions.create({
    model: GROQ_VISION_MODEL,
    max_tokens: 10,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Producto: "${label}".
Mira la imagen y responde SOLO con un número del 0.0 al 1.0:
1.0 = foto clara de exactamente este producto
0.7 = producto correcto pero otra variante/color/ángulo
0.4 = relacionado (misma categoría) pero no es este producto
0.0 = banner, logo, texto, foto genérica o no corresponde
Responde solo el número, sin explicación.`,
          },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  });

  const raw = res.choices[0]?.message?.content ?? "";
  const m = raw.match(/[01](?:\.\d+)?/);
  const score = m ? parseFloat(m[0]) : 0.5;
  if (isNaN(score)) return 0.5;
  return Math.max(0, Math.min(1, score));
}

export interface PickOptions {
  /** Puntaje mínimo para aceptar una imagen. */
  minScore?: number;
  /** Máx. candidatos a verificar con Groq (para acotar costo/latencia). */
  maxChecks?: number;
  /** Pausa (ms) entre llamadas a Groq para respetar rate limits. */
  delayMs?: number;
  /**
   * URL de la imagen actual ("titular"). Un retador solo la reemplaza si le
   * gana por `replaceMargin`; en empate/ruido se conserva la actual.
   */
  incumbentUrl?: string | null;
  /** Margen que un retador debe superar al titular para reemplazarlo. */
  replaceMargin?: number;
}

/**
 * Elige la mejor imagen de una lista de candidatos.
 *
 * 1. Aplica heurísticas (gratis) — descarta banners/logos/stock.
 * 2. Sin Groq: devuelve el titular si pasó el filtro, si no el primer candidato
 *    (que deben venir ordenados por confianza de origen).
 * 3. Con Groq: puntúa hasta `maxChecks` candidatos. Conserva la imagen actual
 *    salvo que un retador la supere por `replaceMargin` (evita churn por ruido).
 *
 * Retorna null si nada útil supera `minScore` (en ese caso el llamador
 * conserva lo que ya había — mejor eso que poner una imagen mala).
 */
export async function pickBestVerifiedImage(
  candidates: ImageCandidate[],
  productTitle: string,
  brand?: string | null,
  opts: PickOptions = {}
): Promise<ImageCandidate | null> {
  const {
    minScore = 0.6,
    maxChecks = 3,
    delayMs = 200,
    incumbentUrl = null,
    replaceMargin = 0.2,
  } = opts;

  const filtered = filterCandidates(candidates);
  if (filtered.length === 0) return null;

  // Sin Groq: confiar en heurísticas + orden de origen.
  if (!process.env.GROQ_API_KEY) {
    const inc = incumbentUrl ? filtered.find((c) => c.url === incumbentUrl) : null;
    return inc ?? { ...filtered[0], score: undefined };
  }

  // El titular va primero para asegurar que siempre se puntúe.
  const ordered = incumbentUrl
    ? [...filtered].sort((a, b) => (a.url === incumbentUrl ? -1 : b.url === incumbentUrl ? 1 : 0))
    : filtered;

  // Puntuar hasta `maxChecks` candidatos válidos. Toleramos que algunos no se
  // puedan descargar (se saltan) probando más abajo en la lista, con un tope de
  // intentos para acotar el tiempo.
  const scored: ImageCandidate[] = [];
  const maxAttempts = Math.min(ordered.length, maxChecks * 3);
  for (let i = 0; i < maxAttempts && scored.length < maxChecks; i++) {
    const c = ordered[i];
    let score: number;
    try {
      score = await scoreImageWithGroq(c.url, productTitle, brand);
    } catch (err: any) {
      if (err?.status === 429) break; // rate limit de Groq: cortar
      continue; // no se pudo descargar este candidato: probar el siguiente
    }
    if (score < 0) break; // Groq no disponible (sin API key)
    scored.push({ ...c, score });
    if (score >= 0.9) break; // candidato claramente correcto: no seguir gastando
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }

  // El titular pasó las heurísticas (no es banner/stock).
  const incumbentInFiltered = incumbentUrl
    ? filtered.find((c) => c.url === incumbentUrl)
    : undefined;
  // El titular pudo puntuarse con Groq (si no, es que no se pudo verificar).
  const incumbentScored = incumbentUrl
    ? scored.find((c) => c.url === incumbentUrl)
    : undefined;

  // Mejor retador (distinto del titular).
  const challenger = scored
    .filter((c) => c.url !== incumbentUrl)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
  const challengerScore = challenger?.score ?? 0;

  // Caso A: el titular es una imagen razonable (pasó heurísticas) pero Groq no
  // pudo descargarla para verificar (p.ej. redirect 302). NO es evidencia de que
  // sea mala → conservarla. Reemplazar acá churnearía imágenes buenas.
  if (incumbentInFiltered && !incumbentScored) return incumbentInFiltered;

  // Caso B: el titular puntúa bien → conservarlo salvo que un retador lo supere
  // por el margen (los puntajes de Groq son ruidosos; exigir diferencia clara).
  if (incumbentScored && (incumbentScored.score ?? 0) >= minScore) {
    if (challenger && challengerScore >= (incumbentScored.score ?? 0) + replaceMargin) {
      return challenger;
    }
    return incumbentScored;
  }

  // Caso C: titular ausente/genérico/con puntaje bajo → tomar el mejor retador
  // si supera el umbral.
  if (challenger && challengerScore >= minScore) return challenger;

  // Caso D: no hay nada mejor. Conservar el titular si existe; si no, nada.
  return incumbentScored ?? incumbentInFiltered ?? null;
}
