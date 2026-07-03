/**
 * Fix broken product images - replaces TikTok/local URLs with Paris.cl or Pexels
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const { searchProductImages } = await import("../src/lib/images/pexels");
  const axios = (await import("axios")).default;

  const BLOCKED_DOMAINS = ["tiktok.com", "pinimg.com", "pinterest.com", "fbcdn.net", "instagram.com"];
  
  const products = await prisma.product.findMany({ where: { isActive: true } });
  let fixed = 0, pexels = 0;

  for (const p of products) {
    const thumb = p.thumbnail || "";
    const isBlocked = BLOCKED_DOMAINS.some(d => thumb.includes(d));
    const isLocal = thumb.startsWith("/images/");
    
    if (isBlocked || isLocal || thumb.includes("tiktok")) {
      process.stdout.write(`\n${p.title.slice(0, 40).padEnd(42)}`);
      
      // Try Paris.cl first
      try {
        const query = p.title.replace(/[^a-zA-Z0-9áéíóúñü\s-]/g, "").trim().slice(0, 60);
        const { data: html } = await axios.get(
          `https://www.paris.cl/search?q=${encodeURIComponent(query)}`,
          { timeout: 6000, headers: { "User-Agent": "Mozilla/5.0" } }
        );
        const regex = /src="(https:\/\/cl-dam-resizer[^"]+\.jpg)"/g;
        const imgs: string[] = [];
        let m;
        while ((m = regex.exec(html)) !== null) {
          if (!imgs.includes(m[1])) imgs.push(m[1]);
        }
        if (imgs.length > 0) {
          await prisma.product.update({ where: { id: p.id }, data: { thumbnail: imgs[0], images: imgs } });
          console.log("✅ Paris");
          fixed++;
          continue;
        }
      } catch {}

      // Fallback to Pexels
      const pi = await searchProductImages(p.title, 3);
      if (pi.length > 0) {
        await prisma.product.update({ where: { id: p.id }, data: { thumbnail: pi[0], images: pi } });
        console.log("🟡 Pexels");
        pexels++;
        fixed++;
      } else {
        console.log("❌ Sin imagen");
      }
    }
  }

  console.log(`\n\n📊 Fijados: ${fixed} (Paris: ${fixed - pexels}, Pexels: ${pexels})`);
  await prisma.$disconnect();
}

main().catch(console.error);
