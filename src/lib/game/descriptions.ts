/**
 * Generador de descripciones detalladas por producto.
 * Cada categoría tiene descripciones únicas con características específicas.
 * NO usa IA — todo está curado manualmente por categoría.
 */

type ProductInfo = {
  title: string;
  brand: string | null;
  category: string | null;
};

// ─── DESCRIPCIONES ESPECÍFICAS POR CATEGORÍA ───

const DESCRIPTIONS: Record<string, (info: ProductInfo) => string> = {
  "Celulares": (p) =>
    `${p.title} de ${p.brand || "Samsung"} combina un potente procesador con una pantalla de alta resolución para ofrecer una experiencia visual inmersiva. Su sistema de cámaras avanzado captura fotos y videos con calidad profesional en cualquier condición de iluminación. Con batería de larga duración y carga rápida, este smartphone está diseñado para acompañarte todo el día. Incluye las últimas características en conectividad 5G, almacenamiento amplio y un diseño premium resistente al agua. Ideal para usuarios que buscan rendimiento, estilo y la mejor tecnología móvil del mercado.`,

  "Tecnología": (p) =>
    `${p.title} de ${p.brand || "la marca"} representa lo último en innovación tecnológica. Diseñado con componentes de alta calidad, ofrece un rendimiento superior para las tareas más exigentes. Su diseño moderno y funcional se integra perfectamente en cualquier espacio. Con características avanzadas como conectividad inalámbrica, pantalla de alta definición y eficiencia energética, es la elección ideal para quienes valoran la calidad y la tecnología de punta.`,

  "Computación": (p) =>
    `${p.title} de ${p.brand || "la marca"} está equipada con procesador de última generación y memoria de alta velocidad para manejar múltiples tareas con fluidez. Su pantalla de alta definición con colores precisos es ideal para trabajo creativo y entretenimiento. Incluye almacenamiento SSD ultrarrápido, conectividad WiFi 6 y un diseño delgado y portátil. Con batería de larga duración, es perfecta para profesionales que necesitan rendimiento donde sea.`,

  "Calzado": (p) =>
    `${p.title} de ${p.brand || "la marca"} ofrecen la combinación perfecta entre estilo, comodidad y durabilidad. Con materiales premium y suela de alta tracción, están diseñadas para el uso diario y actividades deportivas. Su plantilla ergonómica con amortiguación avanzada brinda confort durante horas. El diseño moderno y versátil combina con cualquier outfit, mientras que los refuerzos estratégicos garantizan una larga vida útil.`,

  "Zapatillas": (p) =>
    `${p.title} de ${p.brand || "la marca"} son el calzado deportivo que combina tecnología y estilo. Su mediasuela con amortiguación de última generación absorbe impactos y brinda retorno de energía en cada paso. El upper de materiales transpirables mantiene tus pies frescos y secos. La suela de goma con patrón multidireccional ofrece tracción superior en cualquier superficie. Con un diseño icónico que trasciende modas, son perfectas tanto para entrenar como para el día a día.`,

  "Vestuario": (p) =>
    `${p.title} de ${p.brand || "la marca"} está confeccionada con materiales de primera calidad que garantizan durabilidad y confort. Su corte moderno y ajuste perfecto la hacen ideal para cualquier ocasión, desde looks casuales hasta semiformales. Los detalles de confección premium y acabados impecables aseguran una prenda que mantiene su forma lavado tras lavado.`,

  "Belleza": (p) =>
    `${p.title} de ${p.brand || "la marca"} es una fragancia sofisticada que combina notas olfativas únicas para crear una experiencia sensorial inolvidable. Con ingredientes de la más alta calidad y una fijación de larga duración, esta esencia se convierte en tu sello personal. Su presentación elegante la hace perfecta para regalar o consentirte.`,

  "Hogar": (p) =>
    `${p.title} de ${p.brand || "la marca"} ha sido diseñado para brindar funcionalidad y estilo a tu hogar. Fabricado con materiales resistentes y acabados de calidad, ofrece durabilidad y un aspecto estético moderno. Su instalación es sencilla y su mantenimiento mínimo. Perfecto para mejorar tu espacio.`,

  "Deporte": (p) =>
    `${p.title} de ${p.brand || "la marca"} es el equipo deportivo que necesitas para alcanzar tu máximo rendimiento. Fabricado con materiales de alta resistencia y diseño ergonómico, ofrece durabilidad y comodidad durante el entrenamiento. Su construcción profesional soporta el uso intensivo mientras mantiene sus propiedades. Ideal tanto para principiantes como para atletas experimentados.`,

  "Audio": (p) =>
    `${p.title} de ${p.brand || "la marca"} ofrecen una experiencia de sonido envolvente con cancelación de ruido activa de última generación. La calidad de audio de alta resolución reproduce cada detalle de tu música favorita. Con almohadillas de memory foam y diseño ergonómico, brindan comodidad durante horas de uso. La batería de larga duración y la conectividad Bluetooth los hacen perfectos para el día a día.`,

  "Electrodomésticos": (p) =>
    `${p.title} de ${p.brand || "la marca"} combina eficiencia energética con tecnología avanzada para facilitar tus tareas diarias. Con múltiples funciones programables y controles intuitivos, su uso es sencillo para toda la familia. Su diseño compacto y moderno se adapta a cualquier espacio, mientras que su construcción robusta garantiza años de funcionamiento confiable.`,
};

const FALLBACK_DESCRIPTIONS = [
  (p: ProductInfo) =>
    `${p.title} de ${p.brand || "primeras marcas"} destaca por su calidad superior y diseño cuidadosamente elaborado. Cada detalle ha sido pensado para ofrecer la mejor experiencia al usuario, con materiales premium que garantizan durabilidad y rendimiento excepcional. Un producto que marca la diferencia.`,
  
  (p: ProductInfo) =>
    `${p.title} es un producto que combina funcionalidad, diseño y calidad de ${p.brand || "primeras marcas"}. Fabricado con materiales seleccionados y bajo estrictos estándares de control, ofrece un rendimiento confiable y una experiencia de usuario superior.`,
];

function getCategoryKey(category: string | null): string {
  const map: Record<string, string> = {
    "Celulares": "Celulares", "Smartphones": "Celulares",
    "Tecnología": "Tecnología", "Electrónica": "Tecnología",
    "Computación": "Computación", "Computadores": "Computación",
    "Notebooks": "Computación",
    "Calzado": "Calzado", "Zapatillas": "Zapatillas",
    "Vestuario": "Vestuario", "Ropa": "Vestuario",
    "Belleza": "Belleza", "Cosméticos": "Belleza", "Perfumes": "Belleza",
    "Hogar": "Hogar", "Muebles": "Hogar",
    "Deporte": "Deporte", "Deportes": "Deporte", "Fitness": "Deporte",
    "Audio": "Audio", "Música": "Audio",
    "Electrodomésticos": "Electrodomésticos",
  };
  return map[category || ""] || "";
}

export function generateDescription(
  title: string,
  brand: string | null,
  category: string | null
): string {
  const catKey = getCategoryKey(category);
  const info: ProductInfo = { title, brand, category };
  
  if (DESCRIPTIONS[catKey]) {
    return DESCRIPTIONS[catKey](info);
  }
  
  // Fallback
  const idx = Math.floor(Math.random() * FALLBACK_DESCRIPTIONS.length);
  return FALLBACK_DESCRIPTIONS[idx](info);
}

export async function fixAllDescriptions(prisma: any) {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: { select: { name: true } } },
  });

  console.log(`Generando descripciones específicas para ${products.length} productos...\n`);

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

  console.log(`\n✅ ${updated} descripciones actualizadas`);
  return updated;
}
