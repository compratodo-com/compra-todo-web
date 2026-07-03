/**
 * Generador de descripciones para productos
 * Crea descripciones relevantes según marca, categoría y nombre del producto.
 * Usa plantillas curadas por categoría + detalles específicos del producto.
 */

const CATEGORY_TEMPLATES: Record<string, string[]> = {
  "Tecnología": [
    "{producto} original. Garantía oficial del fabricante. {caracteristicas} Ideal para quienes buscan lo último en tecnología con rendimiento superior.",
    "{producto} {marca} con la más alta calidad y rendimiento. {caracteristicas} Producto sellado de fábrica con garantía oficial.",
    "Descubre el {producto} y lleva tu experiencia tecnológica al siguiente nivel. {caracteristicas} Compatible con los últimos estándares del mercado.",
  ],
  "Celulares": [
    "{producto} {marca} original. {caracteristicas} Perfecto para fotografía, gaming y productividad. Batería de larga duración.",
    "Smartphone {producto} con diseño premium y {caracteristicas}. Pantalla de alta resolución y cámara profesional.",
  ],
  "Calzado": [
    "{producto} {marca} original. {caracteristicas} Diseñadas para brindar la máxima comodidad en tu día a día. Materiales premium.",
    "Zapatillas {producto} con {caracteristicas}. Ideal para uso diario con estilo y confort garantizado.",
  ],
  "Zapatillas": [
    "{producto} {marca} originales. {caracteristicas} La combinación perfecta entre estilo, comodidad y durabilidad.",
    "{producto} con {caracteristicas}. Diseño icónico que nunca pasa de moda. Cómodas y versátiles.",
  ],
  "Vestuario": [
    "Prenda {producto} {marca} original. {caracteristicas} Confeccionada con materiales de alta calidad para mayor durabilidad y confort.",
    "{producto} {marca}. {caracteristicas} Diseño clásico y atemporal. Ideal para cualquier ocasión.",
  ],
  "Belleza": [
    "{producto} {marca} original. {caracteristicas} Fragancia de larga duración con notas únicas y sofisticadas.",
    "{producto} de {marca}. {caracteristicas} Producto premium con los mejores ingredientes.",
  ],
  "Hogar": [
    "{producto} {marca}. {caracteristicas} Diseñado para brindar funcionalidad y estilo a tu hogar.",
    "{producto} con {caracteristicas}. La mejor relación calidad-precio del mercado.",
  ],
  "Deporte": [
    "{producto} {marca} original. {caracteristicas} Equipamiento deportivo de alta calidad para rendir al máximo.",
    "{producto} con {caracteristicas}. Ideal para entrenamiento y competencia.",
  ],
  "Juguetes": [
    "{producto} original. {caracteristicas} Horas de diversión garantizada para los más pequeños.",
  ],
};

const DEFAULT_TEMPLATES = [
  "{producto} original. {caracteristicas} Producto de alta calidad con garantía oficial. Envío a todo Chile.",
  "{producto} con {caracteristicas}. La mejor opción para quienes buscan calidad y buen precio.",
];

// Características por defecto según la categoría
const DEFAULT_FEATURES: Record<string, string[]> = {
  "Tecnología": ["Procesador de última generación", "Pantalla de alta resolución", "Conectividad avanzada", "Diseño moderno y ergonómico"],
  "Celulares": ["Procesador de alto rendimiento", "Cámara de alta resolución", "Batería de larga duración", "Pantalla AMOLED"],
  "Calzado": ["Suela antideslizante", "Material transpirable", "Plantilla ergonómica", "Diseño deportivo"],
  "Zapatillas": ["Suela de goma resistente", "Material transpirable de alta calidad", "Amortiguación avanzada", "Diseño moderno"],
  "Vestuario": ["Confección premium", "Materiales sostenibles", "Diseño atemporal", "Cómodo y versátil"],
  "Belleza": ["Fragancia de larga duración", "Ingredientes premium", "Presentación elegante", "Ideal para regalar"],
  "Hogar": ["Materiales resistentes", "Diseño funcional", "Fácil instalación", "Alta durabilidad"],
  "Deporte": ["Material resistente", "Diseño ergonómico", "Alta durabilidad", "Uso profesional"],
};

const DEFAULT_FEATURES_LIST = ["Alta calidad", "Diseño moderno", "Materiales premium", "Garantía oficial"];

function getCategoryKey(productTitle: string, categoryName: string | null): string {
  const catMap: Record<string, string> = {
    "Tecnología": "Tecnología", "Celulares": "Celulares", "Electrónica": "Tecnología",
    "Computación": "Tecnología", "Calzado": "Calzado", "Zapatillas": "Zapatillas",
    "Vestuario": "Vestuario", "Ropa": "Vestuario", "Belleza": "Belleza",
    "Hogar": "Hogar", "Deporte": "Deporte", "Deportes": "Deporte",
    "Juguetes": "Juguetes", "Música": "Tecnología", "Audio": "Tecnología",
    "Electrodomésticos": "Hogar",
  };
  return catMap[categoryName || ""] || "Tecnología";
}

export function generateDescription(
  title: string,
  brand: string | null,
  categoryName: string | null
): string {
  const catKey = getCategoryKey(title, categoryName);
  const templates = CATEGORY_TEMPLATES[catKey] || DEFAULT_TEMPLATES;
  const features = DEFAULT_FEATURES[catKey] || DEFAULT_FEATURES_LIST;
  
  const template = templates[Math.floor(Math.random() * templates.length)];
  const featureCount = 2 + Math.floor(Math.random() * 2);
  const selectedFeatures = features.sort(() => Math.random() - 0.5).slice(0, featureCount);
  
  const producto = title.length > 40 ? title.slice(0, 40) + "..." : title;
  const marca = brand || "la marca";
  const caracteristicas = selectedFeatures.join(", ").toLowerCase();
  
  let desc = template
    .replace(/{producto}/g, producto)
    .replace(/{marca}/g, marca)
    .replace(/{caracteristicas}/g, caracteristicas);
  
  // Capitalizar primera letra
  desc = desc.charAt(0).toUpperCase() + desc.slice(1);
  
  return desc;
}

export async function fixAllProductDescriptions(prisma: any) {
  const products = await prisma.product.findMany({
    where: { OR: [{ description: null }, { description: "" }] },
    include: { category: { select: { name: true } } },
  });
  
  console.log(`Generando descripciones para ${products.length} productos...`);
  
  let updated = 0;
  for (const p of products) {
    const desc = generateDescription(p.title, p.brand, p.category?.name || null);
    await prisma.product.update({
      where: { id: p.id },
      data: { description: desc },
    });
    updated++;
    console.log(`  ✅ ${p.title.slice(0, 40)}`);
  }
  
  console.log(`\n✅ ${updated} descripciones generadas`);
  return updated;
}
