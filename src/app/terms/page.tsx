import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "Términos y Condiciones | Compra-Todo",
  description: "Términos y condiciones de uso de Compra-Todo, la plataforma de experiencia de compra.",
  path: "/terms",
  noindex: true,
});

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Términos y Condiciones</h1>
      <p className="text-sm text-gray-400 mb-8">Última actualización: Julio 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Aceptación de los Términos</h2>
          <p className="text-gray-600">
            Al acceder y utilizar Compra-Todo (en adelante, &ldquo;la Plataforma&rdquo;), usted acepta estar sujeto a estos 
            Términos y Condiciones. Si no está de acuerdo con alguno de estos términos, le solicitamos que no utilice la Plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Descripción del Servicio</h2>
          <p className="text-gray-600">
            Compra-Todo es una plataforma de entretenimiento que simula una experiencia de compra en línea. 
            Todos los productos, precios, ofertas y seguimientos mostrados en la Plataforma son simulados 
            y forman parte de un juego con fines de entretenimiento. No se realizará ningún despacho de 
            productos reales ni se procesarán pagos reales.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Registro de Usuario</h2>
          <p className="text-gray-600">
            Para utilizar ciertas funcionalidades de la Plataforma, usted deberá registrarse creando una cuenta. 
            Usted es responsable de mantener la confidencialidad de sus credenciales de acceso y de todas las 
            actividades que ocurran bajo su cuenta.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Propiedad Intelectual</h2>
          <p className="text-gray-600">
            Todo el contenido presente en la Plataforma, incluyendo pero no limitado a textos, gráficos, 
            logotipos, imágenes y software, es propiedad de Compra-Todo o de sus proveedores de contenido 
            y está protegido por las leyes de propiedad intelectual aplicables.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Limitación de Responsabilidad</h2>
          <p className="text-gray-600">
            Compra-Todo no se responsabiliza por daños directos, indirectos, incidentales o consecuentes 
            que puedan derivarse del uso o la imposibilidad de uso de la Plataforma. La Plataforma se 
            proporciona &ldquo;tal cual&rdquo; y &ldquo;según disponibilidad&rdquo;.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Modificaciones</h2>
          <p className="text-gray-600">
            Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios 
            entrarán en vigor inmediatamente después de su publicación en la Plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Contacto</h2>
          <p className="text-gray-600">
            Para consultas sobre estos términos, puede contactarnos a través de nuestra página de contacto 
            o enviando un correo a contacto@compra-todo.com.
          </p>
        </section>
      </div>
    </div>
  );
}
