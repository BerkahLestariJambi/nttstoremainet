'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, ShoppingBag, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { cartService } from '@/services/cartService';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

// Definisi interface Product lokal agar tidak bergantung pada export CartContext
export interface Product {
  id: number | string;
  name: string;
  slug?: string;
  description?: string;
  price_pi?: string | number;
  pricePi?: number;
  image_url?: string;
  image?: string;
  stock?: number;
  seller?: {
    store_name?: string;
  };
}

export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { addToCart: addToLocalCart } = useCart();
  const [loading, setLoading] = useState(false);

  const productId = Number(product.id);
  const pricePi = parseFloat(String(product.price_pi || product.pricePi || 0));

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    try {
      // 1. Simpan ke Backend Database jika pengguna login
      try {
        await cartService.addToCart(productId, 1);
      } catch (err) {
        console.warn('Backend cart save error, fallback to context state:', err);
      }

      // 2. Simpan ke CartContext local state
      addToLocalCart({
        id: productId,
        product_id: productId,
        name: product.name,
        pricePi: pricePi,
        quantity: 1,
        image: product.image_url || product.image || '',
      });

      Swal.fire({
        title: 'Berhasil!',
        text: 'Produk berhasil ditambahkan ke keranjang.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error('Add to cart error:', err);
      Swal.fire('Gagal', err.message || 'Gagal menambahkan produk ke keranjang.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    try {
      try {
        await cartService.addToCart(productId, 1);
      } catch (err) {
        console.warn('Backend cart save error, fallback to context state:', err);
      }

      addToLocalCart({
        id: productId,
        product_id: productId,
        name: product.name,
        pricePi: pricePi,
        quantity: 1,
        image: product.image_url || product.image || '',
      });

      router.push('/cart');
    } catch (err) {
      console.error('Buy now error:', err);
      router.push('/cart');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div>
        <div className="h-48 w-full bg-gray-50 rounded-xl overflow-hidden mb-3 relative flex items-center justify-center border border-gray-100">
          {product.image_url || product.image ? (
            <img
              src={product.image_url || product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <span className="text-xs text-gray-400">Tidak ada gambar</span>
          )}
        </div>

        <span className="text-[11px] text-purple-700 font-semibold bg-purple-50 px-2.5 py-0.5 rounded-full inline-block">
          {product.seller?.store_name || 'Penjual NTT'}
        </span>
        <h3 className="font-bold text-gray-900 mt-2 line-clamp-1 text-sm">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
          {product.description || ''}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
            Harga
          </span>
          <span className="text-base font-extrabold text-amber-600">
            π {pricePi}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={loading}
            onClick={handleAddToCart}
            title="Tambah ke Keranjang"
            className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold p-2 rounded-xl transition flex items-center justify-center disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
          </button>

          {product.slug && (
            <Link
              href={`/products/${product.slug}`}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-2.5 py-2 rounded-xl transition"
            >
              Detail
            </Link>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={handleBuyNow}
            className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1 shadow-sm disabled:opacity-50"
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Beli
          </button>
        </div>
      </div>
    </div>
  );
}
