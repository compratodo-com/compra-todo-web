/**
 * Article Content Agent
 * Genera artículos de estilo de vida, compras y bienestar usando IA.
 * Corre semanalmente para crear contenido fresco.
 */

import { prisma } from "@/lib/db/prisma";

const TOPICS = [
  "Las mejores tendencias de consumo para esta temporada",
  "Cómo crear un hogar inteligente sin gastar de más",
  "Los 10 productos que están revolucionando el bienestar digital",
  "Guía de regalos: encuentra el detalle perfecto para cada persona",
  "Minimalismo inteligente: compra menos, vive mejor",
  "Tecnología wearable: ¿vale la pena invertir?",
  "Cómo combinar moda y sostenibilidad en tus compras",
  "Los gadgets que todo home office necesita",
  "Rutina de bienestar: productos que transforman tu día",
  "Tendencias en decoración que dominarán este año",
  "Cómo elegir el regalo tecnológico perfecto",
  "Los mejores podcasts sobre consumo consciente",
  "Guía de compras inteligentes para el nuevo año",
  "Productos que mejoran tu calidad de sueño",
  "La guía definitiva para comprar zapatillas online",
  "Cómo la tecnología está cambiando la forma en que compramos",
  "Los accesorios que todo amante del café necesita",
  "Bienestar digital: herramientas para desconectar",
  "Tendencias en audio: de parlantes a audífonos",
  "Cómo armar el outfit perfecto con compras inteligentes",
];

const ARTICLE_CATEGORIES = ["lifestyle", "shopping", "wellness", "trends"];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñü\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/**
 * Genera un artículo usando OpenAI y lo guarda en la base de datos.
 */
export async function generateArticle(): Promise<{
  title: string;
  slug: string;
  success: boolean;
}> {
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  const category = ARTICLE_CATEGORIES[Math.floor(Math.random() * ARTICLE_CATEGORIES.length)];

  console.log(`[ArticleAgent] Generando artículo: "${topic}" (${category})`);

  // Verificar si ya existe un artículo similar
  const existing = await prisma.article.findFirst({
    where: { title: { contains: topic.slice(0, 30) } },
  });
  if (existing) {
    console.log(`[ArticleAgent] Ya existe un artículo similar, saltando`);
    return { title: topic, slug: slugify(topic), success: false };
  }

  // Generar contenido con OpenAI
  let title = topic;
  let excerpt = "";
  let content = "";

  if (process.env.OPENAI_API_KEY) {
    try {
      const OpenAI = await import("openai").then(m => m.default);
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Eres un periodista experto en estilo de vida, compras y tendencias. 
Escribes para Compra-Todo Magazine, una publicación que inspira a las personas a disfrutar la experiencia de compra.
Debes escribir en español para Chile/Latinoamérica.
El tono debe ser cercano, inspirador y útil.`,
          },
          {
            role: "user",
            content: `Escribe un artículo completo sobre: "${topic}"

Formato requerido:
TÍTULO: (título atractivo y SEO, máximo 60 caracteres)
EXTRACTO: (resumen de 2 oraciones, máximo 120 caracteres)
CONTENIDO: (3-4 párrafos, texto plano sin formato, máximo 300 palabras)

El artículo debe ser interesante, actual y posicionar a Compra-Todo como la mejor experiencia de compra.`,
          },
        ],
        max_tokens: 600,
        temperature: 0.8,
      });

      const text = response.choices[0]?.message?.content || "";

      // Parsear respuesta
      const titleMatch = text.match(/TÍTULO:\s*(.+)/i);
      const excerptMatch = text.match(/EXTRACTO:\s*(.+)/i);
      const contentMatch = text.match(/CONTENIDO:\s*([\s\S]+)/i);

      if (titleMatch) title = titleMatch[1].trim();
      if (excerptMatch) excerpt = excerptMatch[1].trim();
      if (contentMatch) content = contentMatch[1].trim();
    } catch (error) {
      console.error("[ArticleAgent] OpenAI error, usando plantilla:", error);
    }
  }

  // Fallback si OpenAI no está disponible o falla
  if (!content) {
    excerpt = `Descubre las mejores recomendaciones y tendencias sobre ${topic.toLowerCase()}. Una guía completa para disfrutar al máximo tu experiencia de compra.`;
    content = `En Compra-Todo creemos que la mejor experiencia de compra es la que te hace sentir inspirado. Por eso hemos preparado este artículo sobre ${topic.toLowerCase()}, pensando en ayudarte a descubrir productos que realmente transformen tu día a día.

La clave está en encontrar aquello que se adapta a tu estilo de vida. No se trata de comprar por comprar, sino de elegir conscientemente productos que aporten valor, bienestar y alegría a tu rutina.

Explora nuestras recomendaciones y descubre por qué cada vez más personas eligen Compra-Todo como su plataforma de compras favorita. La mejor experiencia de compra comienza aquí.`;
  }

  // 3. Buscar imagen en Pexels
  let imageUrl: string | null = null;
  if (process.env.PEXELS_API_KEY) {
    try {
      const { searchProductImages } = await import("@/lib/images/pexels");
      const pexelImages = await searchProductImages(category === "wellness" ? "wellness lifestyle" : category === "trends" ? "trends fashion" : category === "shopping" ? "shopping lifestyle" : "lifestyle home", 5);
      if (pexelImages.length > 0) imageUrl = pexelImages[0];
    } catch {}
  }

  const slug = slugify(title);

  // Guardar artículo
  await prisma.article.create({
    data: {
      title,
      slug,
      excerpt: excerpt || `Descubre todo sobre ${topic.toLowerCase()} en Compra-Todo Magazine.`,
      content: content || topic,
      imageUrl,
      category,
      tags: [category, "tendencias", "estilo de vida"],
      featured: false,
      publishedAt: new Date(),
    },
  });

  console.log(`[ArticleAgent] ✅ Artículo creado: "${title}"`);

  // Registrar en log de agente
  await prisma.agentLog.create({
    data: {
      agent: "article_generator",
      action: "generate_article",
      status: "success",
      details: { title, category, slug },
    },
  });

  return { title, slug, success: true };
}

/**
 * Genera múltiples artículos de una sola vez (para inicializar)
 */
export async function generateInitialArticles(count = 3): Promise<number> {
  console.log(`[ArticleAgent] Generando ${count} artículos iniciales...\n`);

  let created = 0;
  for (let i = 0; i < count; i++) {
    const result = await generateArticle();
    if (result.success) created++;
    // Pausa entre generaciones
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n[ArticleAgent] ✅ ${created}/${count} artículos creados`);
  return created;
}
