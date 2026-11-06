'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, ShieldCheck, Truck, Star } from 'lucide-react';
import { useCart, Product } from '@/context/CartContext';

// Data produk sampel khas NTT
const DUMMY_PRODUCTS: Record<string, Product> = {
  '1': {
    id: '1',
    name: 'Kain Tenun Ikat Sumba Original',
    category: 'Tenun Ikat',
    priceIdr: 1250000,
    pricePi: 2.5,
    image: 'https://images.unsplash.com/photo-1606760227091-3dd850d492a6?w=800',
    description: 'Kain tenun tradisional buatan tangan pengrajin Sumba Timur dengan pewarna alami serat kayu dan akar mengkudu. Sangat cocok untuk busana adat maupun dekorasi premium.',
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
    description: 'Biji kopi Arabika Bajawa Flores yang ditanam di dataran tinggi vulkanik. Memiliki aroma nutty, chocolatey dengan tingkat keasaman seimbang.',
    stock: 25,
    rating: 4.8,
  },
  '3': {
    id: '3',
    name: 'Madu Hutan Liar Timor 500ml',
    category: 'Hasil Alam',
    priceIdr: 185000,
    pricePi: 0.37,
    image: 'https://images.unsplash.com/photo-1587049352847-81a56d773cae?w=800',
    description: 'Madu murni alami yang dipanen langsung dari hutan belantara Pulau Timor tanpa pemanis buatan atau pengawet.',
    stock: 12,
    rating: 4.9,
  },
};

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Unwrapping params Promise dengan use()
  const { id } = use(params);
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);

  // Ambil data produk berdasarkan ID (fallback ke produk '1' jika tidak ditemukan)
  const product = DUMMY_PRODUCTS[id] || DUMMY_PRODUCTS['1'];

  return (
    <div className="max-w-5xl mx-auto py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-amber-700 mb-6 font-medium text-sm transition"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Katalog
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
        {/* Foto Produk */}
        <div className="h-96 rounded-2xl overflow-hidden bg-gray-50 border">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Detail & Harga */}
        <div className="flex flex-col justify-between">
          <div>
            <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full">
              {product.category}
            </span>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-2">
              {product.name}
            </h1>

            <div className="flex items-center gap-2 mt-2">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span className="text-sm font-bold text-gray-800">
                {product.rating}
              </span>
              <span className="text-gray-400 text-sm">
                • Stok: {product.stock} pcs
              </span>
            </div>

            {/* Kotak Harga Pi & IDR */}
            <div className="mt-4 p-4 bg-purple-50 rounded-2xl border border-purple-100">
              <p className="text-xs text-purple-600 font-semibold uppercase">
                Harga Pi Ecosystem
              </p>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl font-black text-purple-700">
                  {(product.pricePi * qty).toFixed(2)} π
                </span>
                <span className="text-sm text-gray-500 font-medium">
                  (Rp {(product.priceIdr * qty).toLocaleString('id-ID')})
                </span>
              </div>
            </div>

            <p className="text-gray-600 mt-4 leading-relaxed text-sm">
              {product.description}
            </p>
          </div>

          {/* Kontrol Jumlah & Tombol Beli */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm font-medium text-gray-700">Jumlah:</span>
              <div className="flex items-center border rounded-xl overflow-hidden">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 font-bold transition"
                >
                  -
                </button>
                <span className="px-4 py-1.5 font-bold text-gray-800">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 font-bold transition"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                for (let i = 0; i < qty; i++) {
                  addToCart(product);
                }
              }}
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
            >
              <ShoppingBag className="w-5 h-5" /> + Masukkan Keranjang
            </button>

            <div className="grid grid-cols-2 gap-4 mt-6 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-600" /> Transaksi Aman via Pi SDK
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" /> Pengiriman dari NTT
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
