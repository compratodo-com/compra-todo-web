import { NextResponse } from "next/server";
import { COUNTRIES } from "@/lib/currency";

// GET /api/currencies - lista de monedas disponibles
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const detect = searchParams.get("detect");

  // Detectar país desde headers si se solicita
  let detected = null;
  if (detect === "true") {
    const acceptLanguage = req.headers.get("accept-language");
    const { detectCountryFromHeaders } = await import("@/lib/currency");
    const countryCode = detectCountryFromHeaders(acceptLanguage);
    const country = COUNTRIES.find((c) => c.code === countryCode);
    if (country) {
      detected = {
        code: country.code,
        currency: country.currency,
        name: country.name,
        flag: country.flag,
      };
    }
  }

  return NextResponse.json({
    currencies: COUNTRIES.map((c) => ({
      code: c.currency,
      countryCode: c.code,
      name: c.name,
      symbol: c.currencySymbol,
      flag: c.flag,
      locale: c.locale,
    })),
    detected,
    default: "CLP",
  });
}
