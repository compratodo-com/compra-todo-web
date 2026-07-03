export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🛒</span>
              <span className="font-bold text-xl text-white">
                Compra-Todo
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Compra-Todo es la plataforma de experiencia de compra más
              innovadora. Navega productos reales, descubre tendencias y
              vive la emoción de comprar sin gastar dinero real.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Enlaces</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/catalog" className="hover:text-white transition-colors">
                  Catálogo
                </a>
              </li>
              <li>
                <a href="/game" className="hover:text-white transition-colors">
                  Juego y niveles
                </a>
              </li>
              <li>
                <a href="/orders" className="hover:text-white transition-colors">
                  Mis pedidos
                </a>
              </li>
              <li>
                <a href="/ranking" className="hover:text-white transition-colors">
                  Ranking
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-white mb-4">
              Información legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/terms" className="hover:text-white transition-colors">
                  Términos y condiciones
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="hover:text-white transition-colors"
                >
                  Política de privacidad
                </a>
              </li>
              <li>
                <a href="/faq" className="hover:text-white transition-colors">
                  FAQ / ¿Es real?
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer prominent */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-center">
            <p className="text-sm text-red-300 font-medium">
              ⚠️ Compra-Todo es una plataforma de experiencia de compra.
              <br />
              Los productos mostrados son referenciales del mercado. No se
              requiere dinero real para disfrutar la experiencia completa.
            </p>
          </div>
          <p className="text-center text-xs text-gray-600 mt-4">
            © {new Date().getFullYear()} Compra-Todo. Chile.
          </p>
        </div>
      </div>
    </footer>
  );
}
