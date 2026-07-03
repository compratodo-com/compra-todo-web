/**
 * Script para descargar imágenes de todos los productos existentes
 * y subirlas a Vercel Blob (o local en desarrollo).
 * 
 * Ejecutar: pnpm tsx scripts/download-all-images.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("📸 Iniciando descarga masiva de imágenes...\n");

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, externalId: true, title: true, images: true, thumbnail: true },
  });

  console.log(`Total productos: ${products.length}`);

  // Importar el uploader
  const { uploadProductImages } = await import("../src/lib/images/storage");

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const allUrls = [p.thumbnail, ...(p.images || [])].filter(Boolean) as string[];

    if (allUrls.length === 0) {
      skipped++;
      continue;
    }

    // Verificar si ya tiene imágenes locales/blob
    const hasLocalImages = allUrls.some(
      (url) => url.startsWith("/images/") || url.startsWith("https://blob.vercel")
    );
    if (hasLocalImages) {
      skipped++;
      continue;
    }

    process.stdout.write(
      `[${i + 1}/${products.length}] ${p.title.slice(0, 40).padEnd(42)}... `
    );

    const uploaded = await uploadProductImages(allUrls, p.externalId);

    if (uploaded.length > 0) {
      // Actualizar producto con las URLs locales
      await prisma.product.update({
        where: { id: p.id },
        data: {
          thumbnail: uploaded[0],
          images: uploaded,
        },
      });
      success++;
      console.log("✅");
    } else {
      failed++;
      console.log("❌");
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ Descargadas: ${success}`);
  console.log(`   ⏭️  Saltadas (ya locales): ${skipped}`);
  console.log(`   ❌ Falladas: ${failed}`);
  console.log(`   📦 Total procesados: ${products.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
