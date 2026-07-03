import { prisma } from "@/lib/db/prisma";
import { downloadProductImages, cleanupOrphanImages } from "@/lib/images/downloader";
import {
  searchTrendingProducts,
  searchAllTrendingCategories,
  getTopSellingInChile,
  getRisingTrends,
  getProductDescription,
  getProductDetail,
  extractBrand,
  TOP_CATEGORIES,
} from "@/lib/ml/trends";
import type { MLProduct } from "@/lib/ml/trends";

interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
  imagesDownloaded: number;
  productsInCatalog: number;
}

/**
 * Importa productos desde MercadoLibre a la base de datos local.
 * Descarga imágenes, copia descripciones, y mantiene el catálogo actualizado.
 */
export async function importTrendingProducts(
  options: {
    mode?: "all_categories" | "top_selling" | "rising" | "category";
    categoryId?: string;
    maxProducts?: number;
    minSold?: number;
    downloadImages?: boolean;
  } = {}
): Promise<ImportResult> {
  const {
    mode = "all_categories",
    maxProducts = 100,
    minSold = 10,
    downloadImages = true,
  } = options;

  console.log(`[ProductImporter] Starting import mode=${mode} max=${maxProducts} minSold=${minSold}`);

  // 1. Fetch products from MercadoLibre
  let mlProducts: MLProduct[] = [];

  switch (mode) {
    case "top_selling":
      mlProducts = await getTopSellingInChile(maxProducts);
      break;
    case "rising":
      mlProducts = await getRisingTrends(maxProducts);
      break;
    case "category":
      mlProducts = await searchTrendingProducts({
        categoryId: options.categoryId,
        limit: maxProducts,
        minSold,
      });
      break;
    case "all_categories":
    default:
      mlProducts = await searchAllTrendingCategories(
        Math.ceil(maxProducts / TOP_CATEGORIES.length),
        minSold
      );
      break;
  }

  console.log(`[ProductImporter] Fetched ${mlProducts.length} products from ML`);

  // 2. Process each product
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  let imagesDownloaded = 0;

  for (const mlProduct of mlProducts.slice(0, maxProducts)) {
    try {
      const result = await importSingleProduct(mlProduct, downloadImages);
      if (result === "imported") {
        imported++;
        imagesDownloaded += 1; // At least thumbnail
      } else if (result === "updated") {
        updated++;
      } else if (result === "skipped") {
        skipped++;
      }
    } catch (error) {
      console.error(`[ProductImporter] Error importing ${mlProduct.id}:`, error);
      errors++;
    }
  }

  // 3. Clean up orphan images
  const activeIds = (await prisma.product.findMany({
    where: { source: "mercadolibre" },
    select: { externalId: true },
  })).map(p => p.externalId);
  
  const cleanedDirs = cleanupOrphanImages(activeIds);

  // 4. Get total count
  const productsInCatalog = await prisma.product.count({
    where: { isActive: true },
  });

  console.log(`[ProductImporter] Done: ${imported} imported, ${updated} updated, ${skipped} skipped, ${errors} errors, ${cleanedDirs} orphan dirs cleaned`);

  return {
    imported,
    updated,
    skipped,
    errors,
    imagesDownloaded,
    productsInCatalog,
  };
}

/**
 * Importa un solo producto desde ML a la base de datos.
 */
async function importSingleProduct(
  mlProduct: MLProduct,
  shouldDownloadImages: boolean
): Promise<"imported" | "updated" | "skipped"> {
  const externalId = mlProduct.id;

  // Check if product already exists
  const existing = await prisma.product.findUnique({
    where: { externalId },
  });

  // Get pictures (prefer secure_url)
  const imageUrls = mlProduct.pictures?.map((p) => p.secure_url || p.url) || [];
  if (imageUrls.length === 0 && mlProduct.thumbnail) {
    imageUrls.push(mlProduct.thumbnail);
  }

  // Download images if enabled
  let localImages: string[] = [];
  if (shouldDownloadImages && imageUrls.length > 0) {
    localImages = await downloadProductImages(imageUrls, externalId);
  }

  // Get description if needed
  let description = null;
  if (!existing || !existing.description) {
    description = await getProductDescription(externalId);
  }

  // Get brand
  const brand = extractBrand(mlProduct);

  const productData = {
    externalId,
    title: mlProduct.title.slice(0, 255),
    price: mlProduct.price,
    originalPrice: mlProduct.original_price,
    currency: mlProduct.currency_id || "CLP",
    // Use local images if downloaded, otherwise use ML URLs
    images: localImages.length > 0 ? localImages : imageUrls,
    thumbnail: localImages[0] || mlProduct.thumbnail,
    categoryId: await resolveCategoryId(mlProduct.category_id),
    brand,
    condition: mlProduct.condition,
    availableQty: mlProduct.available_quantity,
    soldQuantity: mlProduct.sold_quantity,
    description: description || existing?.description,
    tags: buildTags(mlProduct),
    metadata: {
      ml_seller: mlProduct.seller?.nickname,
      ml_seller_id: mlProduct.seller?.id,
      ml_catalog_product_id: mlProduct.catalog_product_id,
      free_shipping: mlProduct.shipping?.free_shipping,
      local_images: localImages.length > 0,
    },
    isActive: true,
    lastSyncedAt: new Date(),
  };

  if (existing) {
    // Update only if price or sold quantity changed significantly
    const priceChanged = Math.abs(existing.price - mlProduct.price) > 100;
    const salesChanged = existing.soldQuantity !== mlProduct.sold_quantity;

    if (priceChanged || salesChanged) {
      // Record price history
      if (priceChanged) {
        await prisma.productPrice.create({
          data: {
            productId: existing.id,
            price: mlProduct.price,
          },
        });
      }

      await prisma.product.update({
        where: { id: existing.id },
        data: productData,
      });

      return "updated";
    }

    return "skipped";
  }

  // Create new product
  const created = await prisma.product.create({
    data: productData,
  });

  // Record initial price
  await prisma.productPrice.create({
    data: {
      productId: created.id,
      price: mlProduct.price,
    },
  });

  return "imported";
}

/**
 * Resuelve un category_id de ML a nuestra categoría local.
 */
async function resolveCategoryId(
  mlCategoryId: string
): Promise<string | null> {
  if (!mlCategoryId) return null;

  // Try to find by externalId in our category
  const existing = await prisma.category.findFirst({
    where: { externalId: mlCategoryId },
  });

  if (existing) return existing.id;

  // Try to find by parent category name
  const topCategory = TOP_CATEGORIES.find((cat) =>
    mlCategoryId.startsWith(cat.id.split("-")[0])
  );

  if (topCategory) {
    const local = await prisma.category.findFirst({
      where: { name: topCategory.name },
    });
    if (local) return local.id;
  }

  return null;
}

/**
 * Construye tags para el producto basado en sus características.
 */
function buildTags(product: MLProduct): string[] {
  const tags: string[] = [];

  if (product.sold_quantity > 1000) {
    tags.push("trending");
  }
  if (product.sold_quantity > 5000) {
    tags.push("viral");
  }
  if (product.shipping?.free_shipping) {
    tags.push("envio_gratis");
  }
  if (product.original_price && product.original_price > product.price) {
    tags.push("oferta");
  }
  if (product.tags?.includes("new")) {
    tags.push("nuevo");
  }

  return tags;
}
