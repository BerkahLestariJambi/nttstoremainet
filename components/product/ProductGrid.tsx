'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { productService } from '@/services/productService';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price_pi: string;
  image_url: string;
  seller?: {
    store_name: string;
  };
}

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Ambil data produk dinamis dari API Laravel Backend
    productService
      .getProducts()
      .then((res) => {
        // Mendukung format respon { data: [...] } atau array langsung
        const productList = res.data || res;
        setProducts(productList);
      })
      .catch((err) => {
        console.error('Gagal mengambil data produk:', err);
        setError('Gagal memuat produk dari server.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="bg-gray-100 animate-pulse h-64 rounded-2xl"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center text-sm">
        {error}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-2xl">
        Belum ada produk yang tersedia.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <div
          key={product.id}
          className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
        >
          <div>
            <div className="h-48 w-full bg-gray-50 rounded-xl overflow-hidden mb-3">
              <img
                src={product.image_url || '/placeholder-product.jpg'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-full">
              {product.seller?.store_name || 'Penjual NTT'}
            </span>
            <h3 className="font-bold text-gray-900 mt-2 line-clamp-1">
              {product.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {product.description}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 block">Harga</span>
              <span className="text-lg font-extrabold text-amber-600">
                π {product.price_pi}
              </span>
            </div>
            <Link
              href={`/products/${product.slug}`}
              className="bg-gray-900 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
            >
              Detail
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
