'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { productService } from '@/services/productService';
import { ShoppingBag, ImageOff } from 'lucide-react';

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

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nttstorepi.mejatika.com/api';
  // Ambil origin domain backend (menghapus path /api di ujungnya)
  const DOMAIN_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

  useEffect(() => {
    productService
      .getProducts()
      .then((res) => {
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

  // Format URL Gambar fleksibel (Mendukung path /public/products/... & /storage/products/...)
  const getFullImageUrl = (url: string | null) => {
    if (!url) return '/placeholder-product.jpg';
    
    // Jika URL sudah berupa http:// atau https://
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Normalisasi path relatif dari cPanel / Laravel
    let cleanPath = url.startsWith('/') ? url : `/${url}`;

    // Jika path belum diawali /storage atau /public, tambahkan /public
    if (!cleanPath.startsWith('/storage') && !cleanPath.startsWith('/public')) {
      cleanPath = `/public${cleanPath}`;
    }

    return `${DOMAIN_BASE_URL}${cleanPath}`;
  };

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
      <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center text-sm font-medium">
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
            <div className="h-48 w-full bg-gray-100 rounded-xl overflow-hidden mb-3 relative flex items-center justify-center">
              <img
                src={getFullImageUrl(product.image_url)}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Mencegah gambar tertimpa foto Unsplash acak jika URL error
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/placeholder-product.jpg';
                }}
              />
            </div>
            <span className="text-[11px] text-purple-700 font-semibold bg-purple-50 px-2.5 py-0.5 rounded-full inline-block">
              {product.seller?.store_name || 'Penjual NTT'}
            </span>
            <h3 className="font-bold text-gray-900 mt-2 line-clamp-1 text-sm">
              {product.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {product.description}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Harga</span>
              <span className="text-base font-extrabold text-amber-600">
                π {product.price_pi}
              </span>
            </div>
            <Link
              href={`/products/${product.slug}`}
              className="bg-gray-900 hover:bg-purple-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition"
            >
              Detail
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
