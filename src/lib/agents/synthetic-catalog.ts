/**
 * Synthetic Catalog Generator
 * 
 * Genera un catálogo realista y rotativo mientras no tengamos acceso a la API
 * de MercadoLibre. Los productos están basados en datos reales del mercado chileno.
 * 
 * Los agentes ejecutan este generador periódicamente para simular un catálogo vivo
 * con nuevas ofertas, productos destacados y rotación.
 */

import { prisma } from "@/lib/db/prisma";

// ─── Base de datos de productos chilenos reales ───
const PRODUCT_TEMPLATES = [
  // Tecnología
  { brand: "Apple", title: 'iPhone 16 Pro Max 256GB', basePrice: 1549990, cat: "Tecnología" },
  { brand: "Apple", title: 'iPhone 16 Pro 128GB', basePrice: 1249990, cat: "Tecnología" },
  { brand: "Apple", title: 'iPhone 16 128GB', basePrice: 899990, cat: "Tecnología" },
  { brand: "Apple", title: 'MacBook Air M3 15" 16GB/512GB', basePrice: 1499990, cat: "Tecnología" },
  { brand: "Apple", title: 'MacBook Pro M4 Pro 14" 18GB/512GB', basePrice: 2299990, cat: "Tecnología" },
  { brand: "Apple", title: 'iPad Air M2 11" 128GB WiFi', basePrice: 599990, cat: "Tecnología" },
  { brand: "Apple", title: 'Apple Watch Series 10 46mm GPS', basePrice: 449990, cat: "Tecnología" },
  { brand: "Apple", title: 'AirPods Pro 2 USB-C', basePrice: 229990, cat: "Tecnología" },
  { brand: "Samsung", title: 'Galaxy S25 Ultra 512GB', basePrice: 1399990, cat: "Tecnología" },
  { brand: "Samsung", title: 'Galaxy S25+ 256GB', basePrice: 949990, cat: "Tecnología" },
  { brand: "Samsung", title: 'Galaxy A55 5G 256GB', basePrice: 349990, cat: "Tecnología" },
  { brand: "Samsung", title: 'Smart TV 65" Neo QLED 4K QN90C', basePrice: 899990, cat: "Tecnología" },
  { brand: "Samsung", title: 'Smart TV 55" Crystal UHD 4K BU8000', basePrice: 399990, cat: "Tecnología" },
  { brand: "Samsung", title: 'Monitor Odyssey G7 27" 4K 144Hz', basePrice: 499990, cat: "Tecnología" },
  { brand: "Sony", title: 'PlayStation 5 Slim Digital 1TB', basePrice: 549990, cat: "Tecnología" },
  { brand: "Sony", title: 'PlayStation Portal Remote Player', basePrice: 249990, cat: "Tecnología" },
  { brand: "Microsoft", title: 'Xbox Series X 1TB', basePrice: 549990, cat: "Tecnología" },
  { brand: "Nintendo", title: 'Nintendo Switch OLED', basePrice: 399990, cat: "Tecnología" },
  { brand: "ASUS", title: 'Notebook ROG Zephyrus G16 i9/32GB/RTX4070', basePrice: 2199990, cat: "Tecnología" },
  { brand: "Lenovo", title: 'Notebook ThinkPad X1 Carbon Gen 12 i7/16GB', basePrice: 1599990, cat: "Tecnología" },
  { brand: "Sony", title: 'Audífonos WH-1000XM5 Wireless', basePrice: 249990, cat: "Tecnología" },
  { brand: "JBL", title: 'Parlante Bluetooth Charge 5', basePrice: 129990, cat: "Tecnología" },
  { brand: "Xiaomi", title: 'Smart Band 9 Pro', basePrice: 49990, cat: "Tecnología" },
  
  // Calzado
  { brand: "Nike", title: 'Zapatillas Air Force 1 \'07 Blancas', basePrice: 89990, cat: "Calzado" },
  { brand: "Nike", title: 'Zapatillas Air Jordan 1 Mid', basePrice: 129990, cat: "Calzado" },
  { brand: "Nike", title: 'Zapatillas Revolution 7', basePrice: 59990, cat: "Calzado" },
  { brand: "Nike", title: 'Zapatillas Dunk Low Retro', basePrice: 119990, cat: "Calzado" },
  { brand: "Adidas", title: 'Zapatillas Forum Low CL', basePrice: 79990, cat: "Calzado" },
  { brand: "Adidas", title: 'Zapatillas Grand Court Base', basePrice: 59990, cat: "Calzado" },
  { brand: "Puma", title: 'Zapatillas Palermo OG', basePrice: 69990, cat: "Calzado" },
  { brand: "New Balance", title: 'Zapatillas 574 Classic', basePrice: 89990, cat: "Calzado" },
  { brand: "Skechers", title: 'Zapatillas Summits Delson', basePrice: 49990, cat: "Calzado" },
  
  // Vestuario
  { brand: "Adidas", title: 'Polera Essentials Logo 3 Rayas', basePrice: 29990, cat: "Vestuario" },
  { brand: "Nike", title: 'Polera Club Swoosh', basePrice: 27990, cat: "Vestuario" },
  { brand: "Levi\'s", title: 'Jeans 501 Original Fit', basePrice: 59990, cat: "Vestuario" },
  { brand: "Levi\'s", title: 'Jeans 511 Slim Fit', basePrice: 54990, cat: "Vestuario" },
  { brand: "Tommy Hilfiger", title: 'Polera Classic Logo', basePrice: 44990, cat: "Vestuario" },
  { brand: "Under Armour", title: 'Polera Tech 2.0', basePrice: 24990, cat: "Vestuario" },
  { brand: "North Face", title: 'Parka Thermoball Eco', basePrice: 199990, cat: "Vestuario" },
  
  // Belleza
  { brand: "Carolina Herrera", title: 'Perfume Good Girl 80ml', basePrice: 129990, cat: "Belleza" },
  { brand: "Carolina Herrera", title: 'Perfume Bad Boy 100ml', basePrice: 109990, cat: "Belleza" },
  { brand: "Dior", title: 'Perfume Sauvage 100ml', basePrice: 139990, cat: "Belleza" },
  { brand: "Lancôme", title: 'Perfume La Vie Est Belle 100ml', basePrice: 119990, cat: "Belleza" },
  { brand: "L\'Oréal Paris", title: 'Set Maquillaje Profesional 120pz', basePrice: 45990, cat: "Belleza" },
  { brand: "Maybelline", title: 'Paleta Sombras The Nudes 12 colores', basePrice: 19990, cat: "Belleza" },
  { brand: "Braun", title: 'Depiladora Silk-épil 9 Flex', basePrice: 129990, cat: "Belleza" },
  
  // Hogar
  { brand: "Sodimac", title: 'Taladro Percutor Inalámbrico 20V', basePrice: 59990, cat: "Hogar" },
  { brand: "Easy", title: 'Set Jardinería 12 Piezas', basePrice: 34990, cat: "Hogar" },
  { brand: "Cougar", title: 'Silla Gamer Armor One Negro/Rojo', basePrice: 189990, cat: "Hogar" },
  { brand: "Ergotec", title: 'Escritorio Eléctrico Regulable 120x60', basePrice: 249990, cat: "Hogar" },
  { brand: "Sony", title: 'Soundbar HT-S400 2.1 canales', basePrice: 199990, cat: "Hogar" },
  
  // Deporte
  { brand: "Nike", title: 'Bolso Deportivo Gym Club', basePrice: 34990, cat: "Deporte" },
  { brand: "Adidas", title: 'Mochila Classic 3 Rayas', basePrice: 34990, cat: "Deporte" },
  { brand: "Under Armour", title: 'Botella Deportiva 1L', basePrice: 15990, cat: "Deporte" },
  { brand: "Wilson", title: 'Balón Fútbol Gol Competition', basePrice: 29990, cat: "Deporte" },
  { brand: "Head", title: 'Raqueta Tenis Ti. Conquest', basePrice: 89990, cat: "Deporte" },
];

// Imágenes placeholder por categoría
const CATEGORY_IMAGES: Record<string, string[]> = {
  "Tecnología": [
    "https://http2.mlstatic.com/D_NQ_NP_2X_670489-MLU78847035003_082024-F.webp",
    "https://http2.mlstatic.com/D_NQ_NP_2X_830289-MLU76385996932_052024-F.webp",
    "https://http2.mlstatic.com/D_NQ_NP_2X_613582-MLU74991028812_032024-F.webp",
    "https://http2.mlstatic.com/D_NQ_NP_2X_954874-MLU71529416241_092023-F.webp",
  ],
  "Calzado": [
    "https://http2.mlstatic.com/D_NQ_NP_2X_639571-MLU74494663565_022024-F.webp",
    "https://http2.mlstatic.com/D_NQ_NP_2X_735011-MLU75838366463_052024-F.webp",
  ],
  "Vestuario": [
    "https://http2.mlstatic.com/D_NQ_NP_2X_784569-MLU74292048638_022024-F.webp",
  ],
  "Belleza": [
    "https://http2.mlstatic.com/D_NQ_NP_2X_602569-MLU74557207602_032024-F.webp",
    "https://http2.mlstatic.com/D_NQ_NP_2X_784025-MLU74410070034_022024-F.webp",
  ],
  "Hogar": [
    "https://http2.mlstatic.com/D_NQ_NP_2X_891853-MLU74185959904_012024-F.webp",
  ],
  "Deporte": [
    "https://http2.mlstatic.com/D_NQ_NP_2X_735011-MLU75838366463_052024-F.webp",
  ],
};

const DEFAULT_IMAGE = "https://http2.mlstatic.com/D_NQ_NP_2X_670489-MLU78847035003_082024-F.webp";

const DESCRIPTIONS = [
  "Producto original. Garantía oficial. Envío a todo Chile.",
  "La mejor calidad al mejor precio. Compra 100% segura.",
  "Producto sellado de fábrica. Incluye boleta electrónica.",
  "Edición especial con los mejores estándares de calidad.",
  "Diseño innovador con los materiales más resistentes.",
  "Lo último en tecnología con rendimiento superior.",
  "Producto destacado por su relación precio-calidad.",
  "Ideal para regalar. Presentación de lujo.",
  "Máxima durabilidad y confort garantizado.",
  "Colección 2025 con los colores de temporada.",
];

export async function generateSyntheticCatalog(
  options: {
    count?: number;
    forceUpdate?: boolean;
    variationPct?: number;
  } = {}
) {
  const { count = 60, forceUpdate = false, variationPct = 0.05 } = options;
  console.log(`[SyntheticCatalog] Generating ${count} products...`);

  // 1. Ensure categories exist
  const categoryNames = [...new Set(PRODUCT_TEMPLATES.map((p) => p.cat))];
  for (const name of categoryNames) {
    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug, isActive: true },
    });
  }

  const cats = await prisma.category.findMany({ where: { isActive: true } });
  const catMap = Object.fromEntries(cats.map((c) => [c.name, c.id]));

  // 2. Shuffle and pick products
  const shuffled = [...PRODUCT_TEMPLATES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const template of selected) {
    const externalId = `synth-${template.brand}-${template.title.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 30)}-${Math.random().toString(36).slice(2, 6)}`;
    
    // Add daily price variation
    const variation = template.basePrice * variationPct * (Math.random() - 0.5);
    const currentPrice = Math.round(template.basePrice + variation);
    
    // 30% chance of having an "original price" (discount)
    const hasDiscount = Math.random() < 0.3;
    const originalPrice = hasDiscount
      ? Math.round(currentPrice * (1 + 0.15 + Math.random() * 0.25))
      : null;

    // Pick images
    const catImages = CATEGORY_IMAGES[template.cat] || [DEFAULT_IMAGE];
    const images = [catImages[Math.floor(Math.random() * catImages.length)], DEFAULT_IMAGE].slice(0, 2);
    const desc = DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)];

    // Determine tags
    const tags: string[] = [];
    if (hasDiscount) tags.push("oferta");
    if (Math.random() < 0.15) tags.push("trending");
    if (Math.random() < 0.05) tags.push("viral");
    if (Math.random() < 0.1) tags.push("envio_gratis");

    const existing = await prisma.product.findFirst({
      where: { title: { contains: template.title.split(" ").slice(0, 3).join(" ") } },
    });

    if (existing) {
      // Update price if it changed significantly
      if (forceUpdate || Math.abs(existing.price - currentPrice) > 1000) {
        await prisma.productPrice.create({
          data: { productId: existing.id, price: currentPrice },
        });
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            price: currentPrice,
            originalPrice,
            soldQuantity: existing.soldQuantity + Math.floor(Math.random() * 50),
            tags,
            lastSyncedAt: new Date(),
          },
        });
        updated++;
      } else {
        skipped++;
      }
    } else {
      // Create new product
      await prisma.product.create({
        data: {
          externalId,
          title: template.title,
          price: currentPrice,
          originalPrice,
          images,
          thumbnail: images[0],
          categoryId: catMap[template.cat] || null,
          brand: template.brand,
          soldQuantity: Math.floor(500 + Math.random() * 50000),
          rating: 4 + Math.random(),
          tags,
          description: desc,
          isActive: true,
          isFeatured: Math.random() < 0.2,
          source: "synthetic",
        },
      });
      imported++;
    }
  }

  // 3. Deactivate some old products to keep catalog fresh
  const allProducts = await prisma.product.findMany({
    where: { source: "synthetic", isActive: true },
    orderBy: { lastSyncedAt: "asc" },
    skip: count * 2, // Keep at least 2x the new count
  });

  const toDeactivate = Math.min(allProducts.length, Math.floor(count * 0.2));
  for (let i = 0; i < toDeactivate; i++) {
    await prisma.product.update({
      where: { id: allProducts[i].id },
      data: { isActive: false },
    });
  }

  // 4. Get total count
  const totalActive = await prisma.product.count({ where: { isActive: true } });

  console.log(`[SyntheticCatalog] Done: ${imported} new, ${updated} updated, ${skipped} skipped, ${toDeactivate} deactivated. Total active: ${totalActive}`);

  return { imported, updated, skipped, totalActive };
}
