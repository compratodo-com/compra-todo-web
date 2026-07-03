import { prisma } from "@/lib/db/prisma";
import { generateOrderEvents } from "@/lib/utils";

export async function createOrder(
  userId: string,
  items: Array<{ productId: string; quantity: number }>,
  isExpress = false
) {
  // Get products info
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });

  if (products.length !== productIds.length) {
    throw new Error("Algunos productos no están disponibles");
  }

  // Calculate totals
  let subtotal = 0;
  const orderProducts = items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    const totalPrice = product.price * item.quantity;
    subtotal += totalPrice;
    return {
      productId: product.id,
      quantity: item.quantity,
      unitPrice: product.price,
      totalPrice,
    };
  });

  // Generate order
  const orderNumber = `CT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`;
  const trackingCode = `MLC-${Math.floor(Math.random() * 900000) + 100000}`;
  const couriers = ["Chilexpress", "Starken", "Blue Express"];
  const courier = couriers[Math.floor(Math.random() * couriers.length)];

  // Calculate estimated delivery
  const deliveryHours = isExpress ? 12 : 48;
  const estimatedDelivery = new Date(Date.now() + deliveryHours * 3600000);

  // Get user level for coins calculation
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const coinMultiplier = user && user.level >= 5 ? 2 : user && user.level >= 3 ? 1.5 : 1;
  const coinsEarned = Math.floor(subtotal * 0.01 * coinMultiplier);

  // Create order with events
  const timeline = generateOrderEvents(isExpress);

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      status: "confirmed",
      subtotal,
      total: subtotal,
      coinsEarned,
      isExpress,
      trackingCode,
      courier,
      estimatedDelivery,
      products: {
        create: orderProducts,
      },
      events: {
        create: timeline.map((event, index) => ({
          status: event.status,
          title: event.title,
          description: event.description,
          location: event.location,
          isMilestone: event.isMilestone,
          createdAt: new Date(Date.now() + event.delayHours * 3600000),
        })),
      },
    },
    include: {
      products: { include: { product: true } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  // Schedule tracking updates (via the event scheduler)
  await scheduleTrackingUpdates(order.id, timeline);

  return order;
}

async function scheduleTrackingUpdates(orderId: string, timeline: ReturnType<typeof generateOrderEvents>) {
  // In production, this would use BullMQ to schedule jobs.
  // For now, we log the scheduled events.
  console.log(`[Tracking] Order ${orderId}: ${timeline.length} events scheduled`);
}

export async function getOrderWithTracking(orderId: string, userId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
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

  if (!order) return null;

  return {
    ...order,
    products: order.products.map((op) => ({
      id: op.productId,
      title: op.product.title,
      image: op.product.thumbnail || op.product.images[0] || "",
      quantity: op.quantity,
      unitPrice: op.unitPrice,
    })),
  };
}

export async function getUserOrders(userId: string, limit = 10) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      products: {
        include: {
          product: {
            select: { title: true, thumbnail: true, images: true },
          },
        },
      },
      events: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    coinsEarned: order.coinsEarned,
    isExpress: order.isExpress,
    trackingCode: order.trackingCode,
    estimatedDelivery: order.estimatedDelivery,
    createdAt: order.createdAt,
    products: order.products.map((op) => ({
      id: op.productId,
      title: op.product.title,
      image: op.product.thumbnail || op.product.images[0] || "",
      quantity: op.quantity,
      price: op.unitPrice,
    })),
    lastEvent: order.events[0] || null,
  }));
}

export async function advanceOrderStatus(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { events: { orderBy: { createdAt: "asc" } } },
  });

  if (!order || order.status === "delivered" || order.status === "cancelled") {
    return null;
  }

  // Find current status index
  const statusFlow = ["confirmed", "preparing", "picked_up", "in_hub", "in_transit", "out_for_delivery", "delivered"];
  const currentIndex = statusFlow.indexOf(order.status);
  if (currentIndex === -1 || currentIndex >= statusFlow.length - 1) return order;

  const nextStatus = statusFlow[currentIndex + 1];

  // Check if it's time for the next update based on events
  const nextEvent = order.events.find((e) => e.status === nextStatus);
  if (nextEvent && new Date() < nextEvent.createdAt) return order; // Not yet time

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: nextStatus,
      deliveredAt: nextStatus === "delivered" ? new Date() : undefined,
    },
    include: {
      products: { include: { product: true } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  return updated;
}
