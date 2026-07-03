"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
// Using regular img tag for reliable external image loading
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Button, Badge, Skeleton } from "@/components/ui";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { useCurrency } from "@/components/currency/CurrencySelector";

export default function ProductDetailClient() {
  const { currency } = useCurrency();
  const params = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [params.id, currency]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/catalog/${params.id}?currency=${currency}`);
      const data = await res.json();
      setProduct(data);
    } catch (error) {
      console.error("Error loading product:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.findIndex((item: any) => item.productId === product.id);
    if (existing >= 0) {
      cart[existing].quantity += quantity;
    } else {
      cart.push({
        productId: product.id,
        title: product.title,
        price: product.price,
        quantity,
        image: product.thumbnail || product.images?.[0] || "",
      });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <span className="text-6xl">😕</span>
        <h2 className="text-xl font-bold mt-4">Producto no encontrado</h2>
        <Link href="/catalog">
          <Button className="mt-4">Volver al catálogo</Button>
        </Link>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : ["/placeholder.svg"];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/catalog" className="hover:text-purple-600">
          Catálogo
        </Link>
        {product.categoryName && (
          <>
            <span className="mx-2">/</span>
            <span>{product.categoryName}</span>
          </>
        )}
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div>
          <div className="relative aspect-square bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
            <img
              src={images[selectedImage]}
              alt={product.title}
              className="w-full h-full object-contain p-8"
            />
            {product.discount > 0 && (
              <div className="absolute top-4 left-4">
                <Badge variant="danger">
                  -{product.discount}% OFF
                </Badge>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg border-2 overflow-hidden flex-shrink-0 ${
                    i === selectedImage ? "border-purple-600" : "border-gray-200"
                  }`}
                >
                  <img
                      src={img}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.brand && (
            <p className="text-sm text-gray-500 mb-1">{product.brand}</p>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {product.title}
          </h1>

          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold text-purple-700">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-lg text-gray-400 line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
            {product.discount > 0 && (
              <Badge variant="danger">
                {product.discount}% OFF
              </Badge>
            )}
          </div>

          {product.soldQuantity > 0 && (
            <p className="text-sm text-gray-500 mb-6">
              {product.soldQuantity.toLocaleString("es-CL")} vendidos
            </p>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-sm text-gray-600">Cantidad:</span>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1 hover:bg-gray-50"
              >
                -
              </button>
              <span className="px-4 py-1 font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
                className="px-3 py-1 hover:bg-gray-50"
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-8">
            <Button
              size="lg"
              className="flex-1"
              onClick={addToCart}
            >
              {addedToCart ? "✓ Agregado" : "🛒 Agregar al carrito"}
            </Button>
            <Link href={`/checkout?product=${product.id}&qty=${quantity}`}>
              <Button variant="outline" size="lg">
                Comprar ahora
              </Button>
            </Link>
          </div>

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="flex gap-2 mb-6 flex-wrap">
              {product.tags.map((tag: string) => (
                <Badge key={tag} variant="purple">
                  {tag === "trending" ? "🔥 Popular" : tag === "viral" ? "🔥 Viral" : tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Descripción
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {product.related?.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Productos relacionados
          </h2>
          <ProductGrid
            products={product.related.map((p: any) => ({
              id: p.id,
              title: p.title,
              price: p.price,
              originalPrice: p.originalPrice,
              thumbnail: p.thumbnail,
              images: p.images,
              discount: p.discount,
              soldQuantity: p.soldQuantity,
              tags: p.tags,
            }))}
          />
        </section>
      )}

      {/* Disclaimer */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ Este producto es parte del simulador Compra-Todo. Los precios son
          referenciales del mercado real y las imágenes provienen de fuentes
          autorizadas. No se realizará ningún despacho real.
        </p>
      </div>
    </div>
  );
}
