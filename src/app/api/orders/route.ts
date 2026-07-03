import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createOrder, getOrderWithTracking, getUserOrders } from "@/lib/orders";
import { addCoins, addXP, updateTotalSpent, updateMissionProgress } from "@/lib/game";

// GET /api/orders
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const orders = await getUserOrders(session.user.id);
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("[Orders] Error:", error);
    return NextResponse.json(
      { error: "Error al cargar pedidos" },
      { status: 500 }
    );
  }
}

// POST /api/orders
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { items, isExpress } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "El carrito está vacío" },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity < 1) {
        return NextResponse.json(
          { error: "Productos inválidos en el carrito" },
          { status: 400 }
        );
      }
    }

    const order = await createOrder(session.user.id, items, isExpress || false);

    // Award coins and XP
    await addCoins(
      session.user.id,
      order.coinsEarned,
      "earn_from_order",
      `Compra #${order.orderNumber}`,
      order.id
    );

    await addXP(session.user.id, 50);

    // Update total spent and check level up
    const levelInfo = await updateTotalSpent(session.user.id, order.total);

    // Update missions
    await updateMissionProgress(session.user.id, "buy_product", items.length);
    await updateMissionProgress(session.user.id, "spend_amount", Math.floor(order.total));
    await updateMissionProgress(session.user.id, "complete_orders");

    return NextResponse.json(
      {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
          coinsEarned: order.coinsEarned,
          status: order.status,
          trackingCode: order.trackingCode,
          estimatedDelivery: order.estimatedDelivery,
        },
        levelInfo,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Create Order] Error:", error);
    return NextResponse.json(
      { error: "Error al crear pedido" },
      { status: 500 }
    );
  }
}
