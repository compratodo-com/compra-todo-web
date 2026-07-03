import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import fs from "fs";
import path from "path";

// GET /api/admin/config - Obtiene configuración actual (sin secretos)
export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Only return non-sensitive config
    return NextResponse.json({
      appId: process.env.MERCADO_LIBRE_APP_ID || "",
      mlConfigured: !!(process.env.MERCADO_LIBRE_APP_ID && process.env.MERCADO_LIBRE_CLIENT_SECRET),
    });
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// POST /api/admin/config - Guarda configuración en .env.local
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { MERCADO_LIBRE_APP_ID, MERCADO_LIBRE_CLIENT_SECRET } = await req.json();

    if (!MERCADO_LIBRE_APP_ID || !MERCADO_LIBRE_CLIENT_SECRET) {
      return NextResponse.json(
        { error: "App ID y Client Secret son requeridos" },
        { status: 400 }
      );
    }

    // Save to .env.local (persists across restarts)
    const envPath = path.join(process.cwd(), ".env.local");
    const envContent = [
      `# MercadoLibre API (configurado desde admin)`,
      `MERCADO_LIBRE_APP_ID="${MERCADO_LIBRE_APP_ID}"`,
      `MERCADO_LIBRE_CLIENT_SECRET="${MERCADO_LIBRE_CLIENT_SECRET}"`,
      "",
    ].join("\n");

    fs.writeFileSync(envPath, envContent, "utf-8");

    return NextResponse.json({
      success: true,
      message: "Configuración guardada. Reinicia el servidor para aplicar cambios.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al guardar configuración" },
      { status: 500 }
    );
  }
}
