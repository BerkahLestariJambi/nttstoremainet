'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { productService } from '@/services/productService';
import { cartService } from '@/services/cartService';
import { useCart } from '@/context/CartContext';
import { Package, ShoppingBag, ShoppingCart, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

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
  const router = useRouter();
  const { addToCart: addToLocalCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [addingCartId, setAddingCartId] = useState<number | null>(null);
  const [buyingId, setBuyingId] = useState<number | null>(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nttstorepi.mejatika.com/api';
  const DOMAIN_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

  useEffect(() => {
    productService
      .getProducts()
      .then((res: any) => {
        const productList = res.data || res;
        setProducts(Array.isArray(productList) ? productList : []);
      })
      .catch((err) => {
        console.error('Gagal mengambil data produk:', err);
        setError('Gagal memuat produk dari server.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const getFullImageUrl = (url: string | null) => {
    if (!url || typeof url !== 'string' || url.trim() === '') return '';

    let cleanUrl = url.trim();

    if (cleanUrl.includes('localhost') || cleanUrl.includes('127.0.0.1')) {
      const pathOnly = cleanUrl.replace(/^https?:\/\/[^\/]+/, '');
      return `${DOMAIN_BASE_URL}${pathOnly}`;
    }

    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }

    cleanUrl = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;

    if (!cleanUrl.startsWith('/public')) {
      cleanUrl = `/public${cleanUrl}`;
    }

    return `${DOMAIN_BASE_URL}${cleanUrl}`;
  };

  const handleAddToCart = async (product: Product) => {
    setAddingCartId(product.id);
    try {
      try {
        await cartService.addToCart(product.id, 1);
      } catch (err) {
        console.warn('API Cart error, falling back to Context state:', err);
      }

      addToLocalCart({
        id: String(product.id),
        name: product.name,
        category: 'Umum',
        priceIdr: 0,
        pricePi: parseFloat(product.price_pi) || 0,
        image: product.image_url,
        description: product.description,
        stock: 10,
        rating: 5,
      });

      Swal.fire({
        title: 'Berhasil!',
        text: 'Produk berhasil ditambahkan ke keranjang.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error('Gagal menambahkan ke keranjang:', err);
      Swal.fire('Gagal', err.message || 'Gagal menambahkan produk ke keranjang.', 'error');
    } finally {
      setAddingCartId(null);
    }
  };

  const handleBuyNow = async (product: Product) => {
    setBuyingId(product.id);
    try {
      try {
        await cartService.addToCart(product.id, 1);
      } catch (err) {
        console.warn('API Cart error, falling back to Context state:', err);
      }

      addToLocalCart({
        id: String(product.id),
        name: product.name,
        category: 'Umum',
        priceIdr: 0,
        pricePi: parseFloat(product.price_pi) || 0,
        image: product.image_url,
        description: product.description,
        stock: 10,
        rating: 5,
      });

      router.push('/cart');
    } catch (err: any) {
      console.error('Gagal memproses Beli Langsung:', err);
      Swal.fire('Gagal', 'Terjadi kesalahan saat memproses pembelian.', 'error');
    } finally {
      setBuyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="bg-gray-100 animate-pulse h-72 rounded-2xl"></div>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {products.map((product) => {
        const imgUrl = getFullImageUrl(product.image_url);
        const isAddingThis = addingCartId === product.id;
        const isBuyingThis = buyingId === product.id;

        return (
          <div
            key={product.id}
            className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
          >
            <div>
              <div className="h-44 w-full bg-gray-50 rounded-xl overflow-hidden mb-3 relative flex items-center justify-center border border-gray-100">
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={product.name}
                    className="w-full h-full object-cover relative z-10"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : null}

                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 z-0">
                  <Package className="w-8 h-8 mb-1 opacity-50" />
                  <span className="text-[10px] text-gray-400">Tidak Ada Gambar</span>
                </div>
              </div>

              <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-full inline-block">
                {product.seller?.store_name || 'Penjual NTT'}
              </span>
              <h3 className="font-bold text-gray-900 mt-1.5 line-clamp-1 text-sm">
                {product.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {product.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-2">
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-amber-600">π</span>
                <span className="text-sm font-extrabold text-amber-600 truncate">
                  {product.price_pi}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1.5 pt-1">
                <button
                  type="button"
                  disabled={isAddingThis || isBuyingThis}
                  onClick={() => handleAddToCart(product)}
                  title="Tambah ke Keranjang"
                  className="bg-amber-100 hover:bg-amber-200 text-amber-800 p-2 rounded-xl transition flex items-center justify-center disabled:opacity-50"
                >
                  {isAddingThis ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
                </button>

                <Link
                  href={`/products/${product.slug}`}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-2.5 py-2 rounded-xl transition text-center flex-1"
                >
                  Detail
                </Link>

                <button
                  type="button"
                  disabled={isBuyingThis || isAddingThis}
                  onClick={() => handleBuyNow(product)}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition flex items-center justify-center gap-1 shadow-sm disabled:opacity-50 flex-1"
                >
                  {isBuyingThis ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShoppingBag className="w-3.5 h-3.5" />
                  )}
                  <span>Beli</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
