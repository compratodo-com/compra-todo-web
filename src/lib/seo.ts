/**
 * SEO Metadata centralizado para Compra-Todo.
 * 
 * Estrategia de posicionamiento:
 *   "La mejor experiencia de compra online sin gastar dinero"
 *   NO como simulador, SINO como plataforma de experiencia de compra.
 */

export const SITE_CONFIG = {
  name: "Compra-Todo",
  tagline: "La experiencia de compra que te mereces, sin gastar",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://compra-todo.com",
  defaultTitle: "Compra-Todo — La nueva forma de comprar online",
  defaultDescription:
    "Descubre la experiencia de compra más innovadora. Navega miles de productos reales, compara precios, arma tu carrito perfecto y vive la emoción del unboxing. Todo sin gastar un peso.",
  keywords: [
    "comprar online",
    "experiencia de compra",
    "shopping online",
    "navegar productos",
    "comparar precios",
    "tendencias de compra",
    "compras sin gastar",
    "window shopping online",
    "productos trendy",
    "Chile",
    "Latinoamérica",
  ],
  category: "Shopping",
  language: "es",
  locale: "es_CL",
  social: {
    twitter: "@compra_todo",
  },
};

export function buildMetadata({
  title,
  description,
  path = "",
  image,
  product,
  noindex = false,
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  product?: {
    name: string;
    price: number;
    currency: string;
    availability?: string;
    image?: string;
    brand?: string;
  };
  noindex?: boolean;
}) {
  const fullTitle = title
    ? `${title} | ${SITE_CONFIG.name}`
    : SITE_CONFIG.defaultTitle;

  const fullDescription = description || SITE_CONFIG.defaultDescription;
  const canonicalUrl = `${SITE_CONFIG.url}${path}`;
  const defaultImage =
    image || `${SITE_CONFIG.url}/og-image.jpg`;

  return {
    title: fullTitle,
    description: fullDescription,
    keywords: SITE_CONFIG.keywords.join(", "),
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: defaultImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      locale: SITE_CONFIG.locale,
      type: product ? "product" : "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: fullDescription,
      images: [defaultImage],
      site: SITE_CONFIG.social.twitter,
    },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    alternates: {
      canonical: canonicalUrl,
    },
    other: {
      "application/ld+json": JSON.stringify(
        product ? buildProductSchema(product) : buildWebsiteSchema()
      ),
    },
  };
}

function buildWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.defaultDescription,
    inLanguage: SITE_CONFIG.language,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_CONFIG.url}/catalog?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

function buildProductSchema(product: {
  name: string;
  price: number;
  currency: string;
  availability?: string;
  image?: string;
  brand?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image || `${SITE_CONFIG.url}/og-image.jpg`,
    description: `Explora ${product.name} en Compra-Todo. Vive la experiencia de compra perfecta.`,
    brand: product.brand
      ? { "@type": "Brand", name: product.brand }
      : undefined,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      availability: product.availability || "https://schema.org/InStock",
      url: SITE_CONFIG.url,
    },
  };
}

// Textos estratégicos para el sitio
export const SEO_COPIES = {
  heroTitle: "La mejor experiencia de compra online",
  heroSubtitle:
    "Navega, compara y vive la emoción de comprar todo lo que quieras. Sin billetera, sin límites.",
  heroCTA: "Comenzar experiencia",
  featuresTitle: "Por qué Compra-Todo es diferente",
  features: [
    {
      title: "Catálogo infinito",
      desc: "Miles de productos reales para explorar sin restricciones",
    },
    {
      title: "Experiencia real",
      desc: "Siente la emoción de cada compra con tracking en vivo",
    },
    {
      title: "Sin compromiso",
      desc: "La mejor parte: no gastas ni un peso. Cero riesgo, toda la diversión",
    },
  ],
  catalogTitle: "Explora las últimas tendencias",
  catalogDesc:
    "Los productos que están marcando tendencia en Chile y Latinoamérica",
};
