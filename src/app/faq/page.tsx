import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "Preguntas Frecuentes | Compra-Todo",
  description: "Resuelve tus dudas sobre Compra-Todo: cómo funciona, el sistema de monedas, los pedidos simulados y más.",
  path: "/faq",
  noindex: true,
});

const FAQS = [
  {
    q: "¿Qué es Compra-Todo?",
    a: "Compra-Todo es una plataforma de entretenimiento que replica la experiencia de compra online. Puedes navegar productos reales, agregarlos a tu carrito, pagar simuladamente y recibir seguimiento en vivo de tus pedidos. Todo es parte de un juego — no se usa dinero real ni se despachan productos físicos."
  },
  {
    q: "¿Es gratis?",
    a: "Sí, completamente gratis. No necesitas ingresar ningún medio de pago. La experiencia de compra es simulada y tiene fines de entretenimiento."
  },
  {
    q: "¿Necesito registrarme para usar el sitio?",
    a: "Puedes navegar el catálogo sin registrarte. Para realizar compras simuladas, participar en el juego, acumular monedas y subir de nivel, necesitas crear una cuenta gratuita."
  },
  {
    q: "¿Qué son los CompraCoins?",
    a: "Los CompraCoins (🪙) son la moneda virtual del juego. Los ganas al realizar compras simuladas, girar la ruleta, completar misiones y mantener rachas diarias. Puedes gastarlos en giros extra de ruleta, mejoras y personalización."
  },
  {
    q: "¿Cómo funcionan los niveles?",
    a: "Hay 5 niveles: Novato, Cazaofertas, Comprador Pro, Maestro del Carrito y Leyenda Compra-Todo. Subes de nivel acumulando gasto simulado. Cada nivel desbloquea beneficios como mejores premios en la ruleta y envíos más rápidos."
  },
  {
    q: "¿Los productos son reales?",
    a: "Los productos que ves en el catálogo están basados en productos reales del mercado chileno e internacional, con precios referenciales actualizados. Sin embargo, son parte de la simulación — no se venden ni despachan realmente."
  },
  {
    q: "¿Por qué veo diferentes monedas?",
    a: "Compra-Todo está disponible para usuarios de toda Latinoamérica. Puedes cambiar la moneda en el selector del navbar: CLP (Chile), MXN (México), ARS (Argentina), COP (Colombia), PEN (Perú), BRL (Brasil) y USD (Estados Unidos). Los precios se convierten automáticamente."
  },
  {
    q: "¿Cómo funciona el seguimiento de pedidos?",
    a: "Cuando realizas una compra simulada, generamos un número de seguimiento y una línea de tiempo realista con eventos como 'en preparación', 'en centro de distribución', 'en reparto', etc. Puedes seguir tu pedido en tiempo real desde la sección 'Mis Pedidos'."
  },
  {
    q: "¿Qué son los artículos del Magazine?",
    a: "El Magazine es nuestra sección de contenido editorial con artículos sobre tendencias de consumo, estilo de vida, bienestar y viajes. Los artículos se publican regularmente y están diseñados para inspirar tu experiencia de compra."
  },
  {
    q: "¿Cómo funcionan los viajes y paquetes turísticos?",
    a: "La sección de Viajes te permite explorar paquetes turísticos simulados a destinos de todo el mundo. Puedes 'reservar' una experiencia eligiendo pasajeros, equipaje, seguro y extras. Todo es parte de la simulación."
  },
  {
    q: "¿Puedo ver publicidad en el sitio?",
    a: "Compra-Todo puede mostrar anuncios de redes publicitarias para mantener el servicio gratuito. Los anuncios están claramente identificados y no interfieren con la experiencia de compra."
  },
  {
    q: "¿Cómo elimino mi cuenta?",
    a: "Para eliminar tu cuenta, contáctanos a través de nuestra página de contacto o envía un correo a privacidad@compra-todo.com. Procesaremos tu solicitud en un plazo máximo de 10 días hábiles."
  },
  {
    q: "¿Cómo se protegen mis datos?",
    a: "Protegemos tus datos personales de acuerdo con la Ley 21.719 de Chile. Puedes revisar nuestra Política de Privacidad para más detalles sobre qué información recopilamos y cómo la usamos."
  },
  {
    q: "¿Tienen aplicación móvil?",
    a: "Actualmente Compra-Todo funciona como sitio web responsive, accesible desde cualquier navegador en tu celular, tablet o computador. No tenemos app nativa aún."
  },
  {
    q: "¿Cómo puedo anunciarme en Compra-Todo?",
    a: "Tenemos espacios publicitarios disponibles. Revisa nuestra página de Media Kit en el footer del sitio o escríbenos a publicidad@compra-todo.com para más información."
  },
];

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        ❓ Preguntas Frecuentes
      </h1>
      <p className="text-gray-500 mb-10">
        Todo lo que necesitas saber sobre Compra-Todo
      </p>

      <div className="space-y-4">
        {FAQS.map((faq, i) => (
          <details
            key={i}
            className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-purple-200 transition-colors"
          >
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors list-none">
              <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
              <span className="text-purple-600 group-open:rotate-180 transition-transform text-lg flex-shrink-0">▼</span>
            </summary>
            <div className="px-4 pb-4 border-t border-gray-100 pt-3">
              <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
            </div>
          </details>
        ))}
      </div>

      {/* Still have questions */}
      <div className="mt-10 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-center text-white">
        <h2 className="text-xl font-bold mb-2">¿Aún tienes dudas?</h2>
        <p className="text-purple-100 mb-4">Estamos aquí para ayudarte</p>
        <a
          href="/contact"
          className="inline-flex items-center gap-2 bg-white text-purple-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors"
        >
          📧 Contáctanos
        </a>
      </div>
    </div>
  );
}
