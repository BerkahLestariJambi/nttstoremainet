'use client';
import Link from 'next/link';
import { ShoppingCart, Star } from 'lucide-react';
import { Product, useCart } from '@/context/CartContext';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group flex flex-col justify-between">
      <div>
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
          <span className="absolute top-3 left-3 bg-purple-700 text-white text-xs px-2.5 py-1 rounded-full font-semibold">
            {product.category}
          </span>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-1 text-amber-500 text-sm mb-1">
            <Star className="w-4 h-4 fill-amber-500" />
            <span className="font-medium text-gray-700">{product.rating}</span>
          </div>

          <Link href={`/products/${product.id}`}>
            <h3 className="font-bold text-gray-900 text-lg line-clamp-1 hover:text-amber-700 transition">
              {product.name}
            </h3>
          </Link>
          <p className="text-gray-500 text-sm line-clamp-2 mt-1">{product.description}</p>
        </div>
      </div>

      <div className="p-4 pt-0 border-t border-gray-50 mt-3 flex items-center justify-between">
        <div>
          <p className="text-xl font-extrabold text-purple-700 flex items-center gap-1">
            {product.pricePi} <span className="text-xs font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">π</span>
          </p>
          <p className="text-xs text-gray-400">Rp {product.priceIdr.toLocaleString('id-ID')}</p>
        </div>

        <button
          onClick={() => addToCart(product)}
          className="bg-amber-600 hover:bg-amber-700 text-white p-2.5 rounded-xl transition flex items-center gap-2 text-sm font-medium"
        >
          <ShoppingCart className="w-4 h-4" />
          + Keranjang
        </button>
      </div>
    </div>
  );
}
