import { NextResponse } from "next/server";

// GET /api/cron/tracking?key=SECRET
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (key !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { advanceAllOrders } = await import("@/lib/orders");
    const result = await advanceAllOrders();

    return NextResponse.json({ success: true, updated: result.updated, checked: result.checked });
  } catch (error) {
    console.error("[Cron Tracking] Error:", error);
    return NextResponse.json(
      { error: "Error avanzando tracking" },
      { status: 500 }
    );
  }
}
