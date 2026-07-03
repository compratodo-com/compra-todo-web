// ─── Países y monedas para LatAm ───

export interface CountryConfig {
  code: string;          // Código ISO país
  currency: string;      // Código ISO moneda
  currencySymbol: string;
  locale: string;        // para formateo
  name: string;
  flag: string;
  // Factor de conversión desde CLP (base del sistema)
  // El agente Economista ajusta esto periódicamente
  factor: number;
  // Precios psicológicos: redondear a qué múltiplo
  rounding: number;
  // Precio mínimo de producto (para que no haya cosas a $1)
  minPrice: number;
}

// Ordenado por relevancia para el proyecto
export const COUNTRIES: CountryConfig[] = [
  { code: "CL", currency: "CLP", currencySymbol: "$", locale: "es-CL", name: "Chile", flag: "🇨🇱", factor: 1, rounding: 10, minPrice: 1000 },
  { code: "MX", currency: "MXN", currencySymbol: "$", locale: "es-MX", name: "México", flag: "🇲🇽", factor: 0.02, rounding: 10, minPrice: 50 },
  { code: "AR", currency: "ARS", currencySymbol: "$", locale: "es-AR", name: "Argentina", flag: "🇦🇷", factor: 1.33, rounding: 100, minPrice: 500 },
  { code: "CO", currency: "COP", currencySymbol: "$", locale: "es-CO", name: "Colombia", flag: "🇨🇴", factor: 4.67, rounding: 1000, minPrice: 5000 },
  { code: "PE", currency: "PEN", currencySymbol: "S/", locale: "es-PE", name: "Perú", flag: "🇵🇪", factor: 0.0041, rounding: 10, minPrice: 10 },
  { code: "BR", currency: "BRL", currencySymbol: "R$", locale: "pt-BR", name: "Brasil", flag: "🇧🇷", factor: 0.0061, rounding: 5, minPrice: 10 },
  { code: "US", currency: "USD", currencySymbol: "US$", locale: "en-US", name: "Estados Unidos", flag: "🇺🇸", factor: 0.0011, rounding: 1, minPrice: 1 },
];

// Mapa para lookup rápido
const countryMap = new Map(COUNTRIES.map((c) => [c.code, c]));
const currencyMap = new Map(COUNTRIES.map((c) => [c.currency, c]));

export function getCountryByCode(code: string): CountryConfig | undefined {
  return countryMap.get(code.toUpperCase());
}

export function getCountryByCurrency(currency: string): CountryConfig | undefined {
  return currencyMap.get(currency.toUpperCase());
}

export function getCountryByLocale(locale: string): CountryConfig {
  // Detecta desde el navegador: "es-CL" → "CL"
  const parts = locale.split("-");
  const code = parts.length > 1 ? parts[1] : parts[0];
  return getCountryByCode(code) || COUNTRIES[0]; // default: Chile
}

/**
 * Convierte un precio desde CLP a la moneda destino aplicando
 * el factor del país y redondeo psicológico.
 */
export function convertPrice(
  priceCLP: number,
  targetCurrency: string
): number {
  const country = getCountryByCurrency(targetCurrency);
  if (!country || targetCurrency === "CLP") {
    return roundPrice(priceCLP, 10);
  }

  let converted = priceCLP * country.factor;

  // Ajuste de percepción: productos baratos no deben verse irrisorios
  if (converted < country.minPrice && priceCLP > 0) {
    converted = country.minPrice;
  }

  return roundPrice(converted, country.rounding);
}

/**
 * Redondea a precio psicológico:
 *   $49.990 en vez de $49.873
 *   $99.990 en vez de $100.000
 */
function roundPrice(price: number, rounding: number): number {
  if (rounding <= 1) return Math.round(price);

  const rounded = Math.round(price / rounding) * rounding;

  // Precios psicológicos: si termina en 000, restar 10
  const str = String(rounded);
  if (str.length > 3 && str.endsWith("000")) {
    return rounded - rounding;
  }

  return rounded || rounding; // evitar precio 0
}

/**
 * Agrega contexto de países a un producto.
 */
export function addCurrencyContext(
  product: { price: number; originalPrice?: number | null },
  targetCurrency: string
) {
  return {
    ...product,
    price: convertPrice(product.price, targetCurrency),
    originalPrice: product.originalPrice
      ? convertPrice(product.originalPrice, targetCurrency)
      : null,
    currency: targetCurrency,
  };
}

// ─── Geo-detección ───

export async function detectCountryFromIP(): Promise<string> {
  // En producción se usaría un servicio como ipapi.co o ip2location
  // Por ahora detectamos del Accept-Language o default
  return "CL"; // default Chile
}

/**
 * Parsea el header Accept-Language para detectar país.
 * "es-CL,es;q=0.9" → "CL"
 */
export function detectCountryFromHeaders(
  acceptLanguage: string | null
): string {
  if (!acceptLanguage) return "CL";

  const locales = acceptLanguage.split(",").map((l) => l.trim().split(";")[0]);
  for (const locale of locales) {
    const parts = locale.split("-");
    if (parts.length >= 2) {
      const code = parts[1].toUpperCase();
      if (countryMap.has(code)) return code;
    }
  }

  // Probar con el idioma nomás (ej: "es" → buscar primer hispanohablante)
  const lang = locales[0]?.split("-")[0];
  if (lang === "pt") return "BR";
  if (lang === "en") return "US";
  if (lang === "es") return "MX"; // hispanohablante más poblado

  return "CL";
}

/**
 * Calcula el porcentaje del mercado objetivo que representa cada país.
 * Útil para el agente Economista.
 */
export function getMarketShare(): Record<string, number> {
  return {
    MX: 0.35, // México: 35% del mercado LatAm
    BR: 0.30, // Brasil: 30%
    AR: 0.12, // Argentina: 12%
    CO: 0.10, // Colombia: 10%
    CL: 0.07, // Chile: 7%
    PE: 0.04, // Perú: 4%
    US: 0.02, // USA: 2%
  };
}
