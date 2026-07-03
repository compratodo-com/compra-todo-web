import "dotenv/config";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const SEED_PRODUCTS = [
  {
    externalId: "seed-1",
    title: 'iPhone 16 Pro Max 256GB - Titanio Natural',
    price: 1549990,
    originalPrice: 1699990,
    images: ["https://http2.mlstatic.com/D_NQ_NP_2X_670489-MLU78847035003_082024-F.webp"],
    thumbnail: "https://http2.mlstatic.com/D_NQ_NP_2X_670489-MLU78847035003_082024-F.webp",
    categoryName: "Tecnología",
    brand: "Apple",
    soldQuantity: 15234,
    rating: 4.8,
    tags: ["trending"],
    isFeatured: true,
  },
  {
    externalId: "seed-2",
    title: 'Notebook Gamer ASUS ROG Zephyrus G16 i9 32GB RTX 4070',
    price: 2199990,
    originalPrice: 2599990,
    images: ["https://http2.mlstatic.com/D_NQ_NP_2X_830289-MLU76385996932_052024-F.webp"],
    thumbnail: "https://http2.mlstatic.com/D_NQ_NP_2X_830289-MLU76385996932_052024-F.webp",
    categoryName: "Tecnología",
    brand: "ASUS",
    soldQuantity: 8921,
    rating: 4.7,
    tags: ["trending"],
    isFeatured: true,
  },
  {
    externalId: "seed-3",
    title: 'AirPods Pro 2da Generación - Apple',
    price: 229990,
    originalPrice: 279990,
    images: ["https://http2.mlstatic.com/D_NQ_NP_2X_613582-MLU74991028812_032024-F.webp"],
    thumbnail: "https://http2.mlstatic.com/D_NQ_NP_2X_613582-MLU74991028812_032024-F.webp",
    categoryName: "Tecnología",
    brand: "Apple",
    soldQuantity: 28456,
    rating: 4.9,
    tags: ["trending", "viral"],
    isFeatured: true,
  },
  {
    externalId: "seed-4",
    title: 'Zapatillas Nike Air Force 1 Blancas',
    price: 89990,
    originalPrice: 109990,
    images: ["https://http2.mlstatic.com/D_NQ_NP_2X_639571-MLU74494663565_022024-F.webp"],
    thumbnail: "https://http2.mlstatic.com/D_NQ_NP_2X_639571-MLU74494663565_022024-F.webp",
    categoryName: "Calzado",
    brand: "Nike",
    soldQuantity: 34567,
    rating: 4.6,
    tags: ["trending"],
    isFeatured: true,
  },
  {
    externalId: "seed-5",
    title: 'Smart TV Samsung 65" Crystal UHD 4K',
    price: 449990,
    originalPrice: 549990,
    images: ["https://http2.mlstatic.com/D_NQ_NP_2X_954874-MLU71529416241_092023-F.webp"],
    thumbnail: "https://http2.mlstatic.com/D_NQ_NP_2X_954874-MLU71529416241_092023-F.webp",
    categoryName: "Tecnología",
    brand: "Samsung",
    soldQuantity: 12456,
    rating: 4.5,
    tags: [],
    isFeatured: true,
  },
  {
    externalId: "seed-6",
    title: 'Perfume Carolina Herrera Good Girl 80ml',
    price: 129990,
    originalPrice: 159990,
    images: ["https://http2.mlstatic.com/D_NQ_NP_2X_602569-MLU74557207602_032024-F.webp"],
    thumbnail: "https://http2.mlstatic.com/D_NQ_NP_2X_602569-MLU74557207602_032024-F.webp",
    categoryName: "Belleza",
    brand: "Carolina Herrera",
    soldQuantity: 18765,
    rating: 4.8,
    tags: [],
    isFeatured: true,
  },
  {
    externalId: "seed-7",
    title: 'Silla Gamer Cougar Armor One Negro/Rojo',
    price: 189990,
    originalPrice: 249990,
    images: ["https://http2.mlstatic.com/D_NQ_NP_2X_891853-MLU74185959904_012024-F.webp"],
    thumbnail: "https://http2.mlstatic.com/D_NQ_NP_2X_891853-MLU74185959904_012024-F.webp",
    categoryName: "Hogar",
    brand: "Cougar",
    soldQuantity: 6789,
    rating: 4.4,
    tags: [],
    isFeatured: true,
  },
  {
    externalId: "seed-8",
    title: 'Consola PlayStation 5 Slim Digital 1TB',
    price: 549990,
    originalPrice: 599990,
    images: ["https://http2.mlstatic.com/D_NQ_NP_2X_784569-MLU74292048638_022024-F.webp"],
    thumbnail: "https://http2.mlstatic.com/D_NQ_NP_2X_784569-MLU74292048638_022024-F.webp",
    categoryName: "Tecnología",
    brand: "Sony",
    soldQuantity: 21345,
    rating: 4.9,
    tags: ["trending"],
    isFeatured: true,
  },
  {
    externalId: "seed-9",
    title: 'Audífonos Sony WH-1000XM5 Cancelación de Ruido',
    price: 249990,
    originalPrice: 299990,
    images: ["https://http2.mlstatic.com/D_NQ_NP_2X_810577-MLU71893724077_092023-F.webp"],
    thumbnail: "https://http2.mlstatic.com/D_NQ_NP_2X_810577-MLU71893724077_092023-F.webp",
    categoryName: "Tecnología",
    brand: "Sony",
    soldQuantity: 15678,
    rating: 4.7,
    tags: [],
  },
  {
    externalId: "seed-10",
    title: 'Monitor Samsung Odyssey G7 27" Curvo 240Hz',
    price: 399990,
    originalPrice: 499990,
    images: ["https://http2.mlstatic.com/D_NQ_NP_2X_697847-MLU71960093918_092023-F.webp"],
    thumbnail: "https://http2.mlstatic.com/D_NQ_NP_2X_697847-MLU71960093918_092023-F.webp",
    categoryName: "Tecnología",
    brand: "Samsung",
    soldQuantity: 8901,
    rating: 4.6,
    tags: [],
  },
  {
    externalId: "seed-11",
    title: 'Set de Maquillaje Profesional 120 Piezas',
    price: 45990,
    originalPrice: null,
    images: ["https://http2.mlstatic.com/D_NQ_NP_2X_784025-MLU74410070034_022024-F.webp"],
    thumbnail: "https://http2.mlstatic.com/D_NQ_NP_2X_784025-MLU74410070034_022024-F.webp",
    categoryName: "Belleza",
    brand: null,
    soldQuantity: 32109,
    rating: 4.3,
    tags: [],
  },
  {
    externalId: "seed-12",
    title: 'Mochila Juvenil Adidas Classic 3 Rayas',
    price: 34990,
    originalPrice: 45990,
    images: ["https://http2.mlstatic.com/D_NQ_NP_2X_735011-MLU75838366463_052024-F.webp"],
    thumbnail: "https://http2.mlstatic.com/D_NQ_NP_2X_735011-MLU75838366463_052024-F.webp",
    categoryName: "Vestuario",
    brand: "Adidas",
    soldQuantity: 25678,
    rating: 4.5,
    tags: [],
  },
];

const MISSIONS = [
  {
    type: "daily",
    title: "Compra del día",
    description: "Realiza una compra simulada",
    requirement: "buy_product",
    targetCount: 1,
    rewardCoins: 50,
    rewardXp: 25,
    icon: "🛒",
  },
  {
    type: "daily",
    title: "Gira la ruleta",
    description: "Gira la ruleta de la suerte",
    requirement: "spin_wheel",
    targetCount: 1,
    rewardCoins: 30,
    rewardXp: 15,
    icon: "🎡",
  },
  {
    type: "weekly",
    title: "Completa 5 compras",
    description: "Realiza 5 compras simuladas en la semana",
    requirement: "complete_orders",
    targetCount: 5,
    rewardCoins: 300,
    rewardXp: 100,
    icon: "📦",
  },
  {
    type: "weekly",
    title: "Gasta $500.000 simulados",
    description: "Acumula $500.000 en compras simuladas",
    requirement: "spend_amount",
    targetCount: 500000,
    rewardCoins: 500,
    rewardXp: 150,
    icon: "💰",
  },
  {
    type: "achievement",
    title: "Primera compra",
    description: "Realiza tu primera compra simulada",
    requirement: "complete_orders",
    targetCount: 1,
    rewardCoins: 100,
    rewardXp: 50,
    icon: "🏆",
  },
  {
    type: "achievement",
    title: "Coleccionista novato",
    description: "Compra productos de 3 categorías distintas",
    requirement: "buy_category",
    targetCount: 3,
    rewardCoins: 200,
    rewardXp: 75,
    icon: "🏅",
  },
];

async function seed() {
  console.log("🌱 Seeding database...");

  // Create categories
  const categoryNames = [...new Set(SEED_PRODUCTS.map((p) => p.categoryName))];
  const categories = await Promise.all(
    categoryNames.map((name, index) =>
      prisma.category.upsert({
        where: { slug: name!.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") },
        update: {},
        create: {
          name: name!,
          slug: name!.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
          order: index,
        },
      })
    )
  );

  const categoryMap = Object.fromEntries(
    categories.map((c) => [c.name, c.id])
  );

  // Create products
  for (const product of SEED_PRODUCTS) {
    const exists = await prisma.product.findUnique({
      where: { externalId: product.externalId },
    });

    if (!exists) {
      await prisma.product.create({
        data: {
          externalId: product.externalId,
          title: product.title,
          price: product.price,
          originalPrice: product.originalPrice,
          images: product.images,
          thumbnail: product.thumbnail,
          categoryId: categoryMap[product.categoryName] || null,
          brand: product.brand || null,
          soldQuantity: product.soldQuantity,
          rating: product.rating || null,
          tags: product.tags || [],
          isFeatured: product.isFeatured || false,
        },
      });
    }
  }

  // Create missions
  for (const mission of MISSIONS) {
    const exists = await prisma.mission.findFirst({
      where: { title: mission.title },
    });

    if (!exists) {
      await prisma.mission.create({ data: mission });
    }
  }

  console.log(`✅ Seeded ${SEED_PRODUCTS.length} products`);
  console.log(`✅ Seeded ${MISSIONS.length} missions`);
  console.log(`✅ Seeded ${categories.length} categories`);
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
