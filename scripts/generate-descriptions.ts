import "dotenv/config";
import OpenAI from "openai";

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, title: true, brand: true, price: true },
    take: 50,
  });

  console.log(`Generando descripciones SEO para ${products.length} productos...\n`);

  let updated = 0;
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    process.stdout.write(`[${i + 1}/${products.length}] ${p.title.slice(0, 40).padEnd(42)}`);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "Eres un redactor SEO experto en e-commerce. Genera descripciones de productos en español para Chile. Incluye características clave y palabras relevantes. Responde SOLO con la descripción en texto plano, sin formato ni introducciones.",
          },
          {
            role: "user",
            content: `Escribe una descripción SEO de 80-120 palabras para este producto:\n\nProducto: ${p.title}\nMarca: ${p.brand || "Genérica"}`,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      const desc = response.choices[0]?.message?.content?.trim();
      if (desc && desc.length > 50) {
        await prisma.product.update({
          where: { id: p.id },
          data: { description: desc },
        });
        console.log("✅");
        updated++;
      } else {
        console.log("⬜");
      }
    } catch (error: any) {
      console.log("❌", error.message?.slice(0, 50) || "Error");
    }

    await new Promise((r) => setTimeout(r, 600));
  }

  console.log(`\n✅ ${updated}/${products.length} descripciones generadas`);
  await prisma.$disconnect();
}

main().catch(console.error);
