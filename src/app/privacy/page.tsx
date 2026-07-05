import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "Política de Privacidad | Compra-Todo",
  description: "Política de privacidad de Compra-Todo. Conoce cómo protegemos tus datos personales.",
  path: "/privacy",
  noindex: true,
});

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Política de Privacidad</h1>
      <p className="text-sm text-gray-400 mb-8">Última actualización: Julio 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Información que Recopilamos</h2>
          <p className="text-gray-600">
            Recopilamos la siguiente información cuando utiliza nuestra Plataforma:
          </p>
          <ul className="list-disc pl-5 text-gray-600 space-y-1 mt-2">
            <li>Información de registro: alias, dirección de correo electrónico (opcional)</li>
            <li>Información de uso: páginas visitadas, productos vistos, interacciones en el juego</li>
            <li>Información del dispositivo: tipo de navegador, sistema operativo, país aproximado</li>
            <li>Cookies y tecnologías similares para mejorar la experiencia de usuario</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Uso de la Información</h2>
          <p className="text-gray-600">
            Utilizamos la información recopilada para:
          </p>
          <ul className="list-disc pl-5 text-gray-600 space-y-1 mt-2">
            <li>Proporcionar y mantener la experiencia de compra simulada</li>
            <li>Mejorar nuestros servicios y desarrollar nuevas funcionalidades</li>
            <li>Enviar comunicaciones relacionadas con el juego (si usted ha proporcionado su email)</li>
            <li>Analizar tendencias de uso y comportamiento en la plataforma</li>
            <li>Cumplir con obligaciones legales y regulatorias</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Google Analytics</h2>
          <p className="text-gray-600">
            Utilizamos Google Analytics para analizar el uso de nuestra Plataforma. Google Analytics 
            recopila información mediante cookies y tecnologías similares. Puede obtener más información 
            sobre cómo Google recopila y procesa datos visitando 
            <a href="https://policies.google.com/privacy" className="text-purple-600 hover:text-purple-700" target="_blank" rel="noopener noreferrer"> policies.google.com/privacy</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Publicidad</h2>
          <p className="text-gray-600">
            Nuestra Plataforma puede mostrar anuncios publicitarios proporcionados por redes publicitarias 
            de terceros. Estas redes pueden utilizar cookies y tecnologías similares para mostrar anuncios 
            basados en sus intereses. Consulte nuestras políticas de cookies para más información.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Almacenamiento de Datos</h2>
          <p className="text-gray-600">
            Sus datos se almacenan en servidores seguros ubicados en Estados Unidos y Chile. 
            Implementamos medidas de seguridad técnicas y organizativas para proteger su información 
            contra acceso no autorizado, pérdida o alteración.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Sus Derechos</h2>
          <p className="text-gray-600">
            De acuerdo con la Ley 21.719 de Chile sobre protección de datos personales, usted tiene 
            derecho a:
          </p>
          <ul className="list-disc pl-5 text-gray-600 space-y-1 mt-2">
            <li>Solicitar el acceso a sus datos personales</li>
            <li>Solicitar la rectificación de datos inexactos</li>
            <li>Solicitar la eliminación de sus datos</li>
            <li>Oponerse al procesamiento de sus datos</li>
            <li>Solicitar la portabilidad de sus datos</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Contacto</h2>
          <p className="text-gray-600">
            Para ejercer sus derechos o realizar consultas sobre esta política, puede contactarnos a 
            través de nuestra página de contacto o escribiendo a privacidad@compra-todo.com.
          </p>
        </section>
      </div>
    </div>
  );
}
