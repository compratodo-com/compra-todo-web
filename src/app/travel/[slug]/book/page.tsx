import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BookTravelExperience } from "@/components/travel/BookTravelExperience";

export default async function BookTravelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pkg = await prisma.travelPackage.findUnique({ where: { slug } });
  if (!pkg) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/travel" className="hover:text-purple-600">Viajes</Link>
        <span className="mx-2">/</span>
        <Link href={`/travel/${slug}`} className="hover:text-purple-600">{pkg.title.slice(0, 30)}</Link>
        <span className="mx-2">/</span>
        <span>Reservar</span>
      </nav>

      <BookTravelExperience
        pkg={{
          id: pkg.id,
          title: pkg.title,
          slug: pkg.slug,
          destination: pkg.destination,
          price: pkg.price,
          duration: pkg.duration,
          includes: pkg.includes,
          thumbnail: pkg.thumbnail,
        }}
      />
    </div>
  );
}
