import { prisma } from "@/lib/db/prisma";
import { formatCurrency } from "@/lib/utils";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email] Simulated send to ${payload.to}: ${payload.subject}`);
    return true;
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Compra-Todo <juego@compra-todo.com>",
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
    return true;
  } catch (error) {
    console.error(`[Email] Failed to send to ${payload.to}:`, error);
    return false;
  }
}

export function orderConfirmationEmail(
  email: string,
  data: {
    orderNumber: string;
    userName: string;
    items: Array<{ title: string; quantity: number; price: number }>;
    total: number;
    coinsEarned: number;
    estimatedDelivery: string;
  }
): EmailPayload {
  return {
    to: email,
    subject: `🎮 [JUEGO] Pedido #${data.orderNumber} confirmado — Compra-Todo`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <div style="text-align:center;padding:20px 0;border-bottom:2px solid #eee">
          <h1 style="color:#6C3AF5;margin:0">🛒 Compra-Todo</h1>
          <p style="color:#888;font-size:12px">Simulador de compras — Todo es parte del juego</p>
        </div>

        <div style="padding:20px 0">
          <h2>¡Pedido confirmado, ${data.userName}! 🎉</h2>
          <p style="color:#555">Prepárate para seguirlo en tiempo real durante las próximas horas.</p>

          <div style="background:#f5f5ff;border-radius:12px;padding:16px;margin:16px 0">
            <p style="margin:0 0 8px"><strong>📦 Pedido #${data.orderNumber}</strong></p>
            ${data.items
              .map(
                (item) =>
                  `<p style="margin:4px 0;color:#555">${item.quantity}x ${item.title} — ${formatCurrency(item.price * item.quantity)}</p>`
              )
              .join("")}
            <hr style="border:none;border-top:1px solid #ddd;margin:12px 0" />
            <p style="margin:0;font-size:18px"><strong>Total simulado: ${formatCurrency(data.total)}</strong></p>
          </div>

          <div style="background:#e8f5e9;border-radius:12px;padding:16px;margin:16px 0">
            <p style="margin:0"><strong>🪙 +${data.coinsEarned} CompraCoins</strong> añadidos a tu cuenta</p>
          </div>

          <div style="background:#fff8e1;border-radius:12px;padding:16px;margin:16px 0">
            <p style="margin:0">🚚 Entrega estimada: <strong>${data.estimatedDelivery}</strong></p>
          </div>

          <div style="background:#ffebee;border-radius:12px;padding:12px;margin:16px 0">
            <p style="margin:0;color:#c62828;font-size:13px">
              ⚠️ <strong>Esto es parte del juego Compra-Todo.</strong> 
              Ningún producto real será despachado. Este es un simulador de compras con fines de entretenimiento.
            </p>
          </div>
        </div>

        <div style="border-top:2px solid #eee;padding:16px 0;font-size:12px;color:#888;text-align:center">
          <p>Compra-Todo · Simulador de compras · Chile</p>
          <p>
            <a href="{{unsubscribe_url}}" style="color:#888">Cancelar suscripción</a>
          </p>
        </div>
      </div>
    `,
  };
}

export function deliveryUpdateEmail(
  email: string,
  data: {
    orderNumber: string;
    userName: string;
    status: string;
    title: string;
    description: string;
    trackingUrl: string;
  }
): EmailPayload {
  const statusIcons: Record<string, string> = {
    confirmed: "✅",
    preparing: "📦",
    picked_up: "🚛",
    in_hub: "🏭",
    in_transit: "🚚",
    out_for_delivery: "🚚",
    delivered: "🎉",
  };

  return {
    to: email,
    subject: `📦 [JUEGO] #${data.orderNumber} — ${data.title}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <div style="text-align:center;padding:20px 0;border-bottom:2px solid #eee">
          <h1 style="color:#6C3AF5;margin:0">🛒 Compra-Todo</h1>
          <p style="color:#888;font-size:12px">Simulador de compras — Todo es parte del juego</p>
        </div>

        <div style="padding:20px 0">
          <h2>${statusIcons[data.status] || "📦"} ${data.title}</h2>
          <p style="color:#555">${data.description}</p>
          <p style="color:#888">Pedido #${data.orderNumber}</p>

          <a href="${data.trackingUrl}" style="display:inline-block;background:#6C3AF5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">
            Ver seguimiento completo
          </a>
        </div>

        <div style="background:#ffebee;border-radius:12px;padding:12px;margin:16px 0">
          <p style="margin:0;color:#c62828;font-size:13px">
            ⚠️ <strong>Esto es parte del juego Compra-Todo.</strong> 
            Seguimiento simulado — ningún producto real será despachado.
          </p>
        </div>

        <div style="border-top:2px solid #eee;padding:16px 0;font-size:12px;color:#888;text-align:center">
          <p>Compra-Todo · Simulador de compras · Chile</p>
          <p><a href="{{unsubscribe_url}}" style="color:#888">Cancelar suscripción</a></p>
        </div>
      </div>
    `,
  };
}

export function offerEmail(
  email: string,
  data: {
    userName: string;
    offerTitle: string;
    offerDescription: string;
    products: Array<{ title: string; price: number; image: string; url: string }>;
  }
): EmailPayload {
  return {
    to: email,
    subject: `🔥 [JUEGO] ${data.offerTitle} — Compra-Todo`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <div style="text-align:center;padding:20px 0;border-bottom:2px solid #eee">
          <h1 style="color:#6C3AF5;margin:0">🛒 Compra-Todo</h1>
          <p style="color:#888;font-size:12px">Simulador de compras — Todo es parte del juego</p>
        </div>

        <div style="padding:20px 0">
          <h2>🔥 ${data.offerTitle}</h2>
          <p style="color:#555">${data.offerDescription}</p>

          <div style="display:grid;gap:16px;margin:16px 0">
            ${data.products
              .slice(0, 4)
              .map(
                (p) => `
              <div style="display:flex;gap:12px;padding:12px;background:#f9f9f9;border-radius:8px">
                <img src="${p.image}" style="width:64px;height:64px;object-fit:cover;border-radius:8px" />
                <div>
                  <p style="margin:0 0 4px;font-weight:600">${p.title}</p>
                  <p style="margin:0;color:#6C3AF5;font-weight:700">${formatCurrency(p.price)}</p>
                </div>
              </div>
            `
              )
              .join("")}
          </div>

          <a href="{{catalog_url}}" style="display:inline-block;background:#6C3AF5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">
            Ver ofertas →
          </a>
        </div>

        <div style="background:#ffebee;border-radius:12px;padding:12px;margin:16px 0">
          <p style="margin:0;color:#c62828;font-size:13px">
            ⚠️ <strong>Beneficio del juego Compra-Todo.</strong> Los descuentos y ofertas aplican solo dentro del simulador.
          </p>
        </div>

        <div style="border-top:2px solid #eee;padding:16px 0;font-size:12px;color:#888;text-align:center">
          <p>Compra-Todo · Simulador de compras · Chile</p>
          <p><a href="{{unsubscribe_url}}" style="color:#888">Cancelar suscripción</a></p>
        </div>
      </div>
    `,
  };
}
