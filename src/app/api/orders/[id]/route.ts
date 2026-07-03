import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { getOrderWithTracking } from "@/lib/orders";

// GET /api/orders/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Check if it's a tracking code instead of ID
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id, userId: session.user.id },
          { trackingCode: id, userId: session.user.id },
        ],
      },
      include: {
        products: {
          include: {
            product: {
              select: { title: true, thumbnail: true, images: true },
            },
          },
        },
        events: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...order,
      products: order.products.map((op) => ({
        id: op.productId,
        title: op.product.title,
        image: op.product.thumbnail || op.product.images[0] || "",
        quantity: op.quantity,
        unitPrice: op.unitPrice,
      })),
    });
  } catch (error) {
    console.error("[Order Detail] Error:", error);
    return NextResponse.json(
      { error: "Error al cargar pedido" },
      { status: 500 }
    );
  }
}
