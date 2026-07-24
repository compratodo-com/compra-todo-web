"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Minus, Plus } from "lucide-react"
import { useCurrency } from "@/components/currency/CurrencySelector"
import { ProductGrid } from "@/components/catalog/ProductCard"

type InitialProduct = {
  id: string
  title: string
  description: string | null
  price: number
  originalPrice: number | null
  currency: string
  discount: number
  images: string[] | null
  thumbnail: string | null
  brand: string | null
  soldQuantity: number
  tags: string[] | null
  categoryName: string | null
  related: Array<{
    id: string
    title: string
    price: number
    originalPrice: number | null
    thumbnail: string | null
    images: string[]
    discount: number
    soldQuantity: number
    tags: string[]
  }>
}

export default function ProductDetailClient({
  initialProduct,
}: {
  initialProduct: InitialProduct
}) {
  const { currency } = useCurrency()
  const params = useParams()
  const id = typeof params.id === "string" ? params.id : ""

  const [product, setProduct] = useState(initialProduct)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [loading, setLoading] = useState(false)

  // Re-fetch when currency changes (covers mount + user switching currency)
  useEffect(() => {
    if (currency === product.currency) return
    const fetchProduct = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/catalog/${id}?currency=${currency}`)
        if (!res.ok) throw new Error("Failed to fetch product")
        const data = await res.json()
        setProduct(data)
      } catch (err) {
        console.error("Error fetching product:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency])

  // Re-fetch when product id changes (navigating between products)
  useEffect(() => {
    if (id === product.id) return
    const fetchProduct = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/catalog/${id}?currency=${currency}`)
        if (!res.ok) throw new Error("Failed to fetch product")
        const data = await res.json()
        setProduct(data)
      } catch (err) {
        console.error("Error fetching product:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const displayPrice = product.price.toLocaleString("es-CL", {
    style: "currency",
    currency: product.currency === "UF" ? "CLF" : product.currency,
    minimumFractionDigits: product.currency === "UF" ? 2 : 0,
    maximumFractionDigits: product.currency === "UF" ? 2 : 0,
  })

  const images = product.images && product.images.length > 0 ? product.images : ["/placeholder.svg"]

  const handleAddToCart = async () => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]")
      const existingIndex = cart.findIndex((item: { productId: string }) => item.productId === product.id)

      if (existingIndex >= 0) {
        cart[existingIndex].quantity += quantity
      } else {
        cart.push({
          productId: product.id,
          title: product.title,
          price: product.price,
          quantity,
          image: images[0],
        })
      }

      localStorage.setItem("cart", JSON.stringify(cart))
      window.dispatchEvent(new CustomEvent("cartUpdated"))

      alert("✅ Producto agregado al carrito")
    } catch (err) {
      console.error("Error adding to cart:", err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
            <div className="rounded-lg bg-white px-6 py-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                <span className="text-sm text-gray-600">Actualizando precios...</span>
              </div>
            </div>
          </div>
        )}
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-12">
          {/* Image gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-white shadow-sm">
              <Image
                src={images[selectedImage] || "/placeholder.svg"}
                alt={product.title}
                fill
                className="object-contain p-8"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 shadow-sm transition-all ${
                      idx === selectedImage ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Image
                      src={img || "/placeholder.svg"}
                      alt={`${product.title} - Vista ${idx + 1}`}
                      fill
                      className="object-contain p-2"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="mt-8 lg:mt-0">
            <div className="space-y-6">
              {product.categoryName && (
                <span className="inline-block rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
                  {product.categoryName}
                </span>
              )}

              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">{product.title}</h1>
                {product.brand && <p className="mt-1 text-sm text-gray-500">{product.brand}</p>}
              </div>

              <div className="border-t border-gray-200 pt-6">
                <p className="text-4xl font-bold text-blue-600">{displayPrice}</p>
              </div>

              {product.description && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-medium text-gray-900">Descripción</h3>
                  <div className="mt-2 space-y-2">
                    <p className="text-base text-gray-700 leading-relaxed">{product.description}</p>
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-900">Cantidad:</span>
                  <div className="flex items-center rounded-xl border border-gray-300 bg-white shadow-sm">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="flex h-10 w-10 items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-l-xl transition-colors"
                      aria-label="Reducir cantidad"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="flex h-10 w-12 items-center justify-center text-sm font-medium tabular-nums border-x border-gray-200">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="flex h-10 w-10 items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-r-xl transition-colors"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Add to cart */}
              <button
                onClick={handleAddToCart}
                className="w-full rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl active:scale-[0.98]"
              >
                Agregar al Carrito
              </button>

              {/* Buy now */}
              <Link
                href={`/checkout?product=${product.id}&qty=${quantity}`}
                className="block w-full rounded-xl bg-green-600 px-8 py-4 text-base font-semibold text-white shadow-lg text-center transition-all hover:bg-green-700 hover:shadow-xl active:scale-[0.98]"
              >
                Comprar Ahora
              </Link>
            </div>
          </div>
        </div>

        {/* Related products */}
        {product.related && product.related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Productos Relacionados
            </h2>
            <ProductGrid products={product.related} />
          </div>
        )}
      </div>
    </div>
  )
}
