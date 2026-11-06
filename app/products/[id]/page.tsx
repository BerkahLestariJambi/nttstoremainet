'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart, Product } from '@/context/CartContext';

const DUMMY_PRODUCTS: Record<string, Product> = {
  '1': {
    id: '1',
    name: 'Kain Tenun Ikat Sumba Original',
    category: 'Tenun Ikat',
    priceIdr: 1250000,
    pricePi: 2.5,
    image: 'https://images.unsplash.com/photo-1606760227091-3dd850d492a6?w=800',
    description: 'Kain tenun tradisional buatan tangan pengrajin Sumba Timur dengan pewarna alami serat kayu dan akar mengkudu.',
    stock: 5,
    rating: 4.9,
  },
  '2': {
    id: '2',
    name: 'Kopi Flores Bajawa Specialty 500g',
    category: 'Kopi Flores',
    priceIdr: 150000,
    pricePi: 0.3,
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800',
    description: 'Biji kopi Arabika Bajawa Flores pilihan.',
    stock: 25,
    rating: 4.8,
  },
};

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = React.use(params);
  const productId = resolvedParams.id;
  const { addToCart } = useCart();
  const [qty, setQty] = useState<number>(1);

  const product = DUMMY_PRODUCTS[productId] || DUMMY_PRODUCTS['1'];

  return (
    <div className="max-w-5xl mx-auto py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-amber-700 mb-6 font-medium text-sm transition"
      >
        ← Kembali ke Katalog
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="h-96 rounded-2xl overflow-hidden bg-gray-50 border">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full">
              {product.category}
            </span>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-2">{product.name}</h1>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-amber-500 font-bold">★ {product.rating}</span>
              <span className="text-gray-400 text-sm">• Stok: {product.stock} pcs</span>
            </div>

            <div className="mt-4 p-4 bg-purple-50 rounded-2xl border border-purple-100">
              <p className="text-xs text-purple-600 font-semibold uppercase">Harga Pi Ecosystem</p>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl font-black text-purple-700">
                  {(product.pricePi * qty).toFixed(2)} π
                </span>
                <span className="text-sm text-gray-500 font-medium">
                  (Rp {(product.priceIdr * qty).toLocaleString('id-ID')})
                </span>
              </div>
            </div>

            <p className="text-gray-600 mt-4 leading-relaxed text-sm">{product.description}</p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm font-medium text-gray-700">Jumlah:</span>
              <div className="flex items-center border rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 font-bold transition"
                >
                  -
                </button>
                <span className="px-4 py-1.5 font-bold text-gray-800">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 font-bold transition"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                for (let i = 0; i < qty; i++) addToCart(product);
              }}
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
            >
              + Masukkan Keranjang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
