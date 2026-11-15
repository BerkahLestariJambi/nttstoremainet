'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { productService, getEffectivePricePi } from '@/services/productService';
import { cartService } from '@/services/cartService';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import FlashSaleBanner from '@/components/FlashSaleBanner';
import {
  Search,
  Package,
  ShoppingBag,
  ShoppingCart,
  Loader2,
  ArrowLeft,
  SlidersHorizontal,
  Zap,
} from 'lucide-react';
import Swal from 'sweetalert2';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price_pi: string | number;
  discount_price_pi?: string | number | null;
  effective_price_pi?: string | number;
  discount_percentage?: number;
  is_promo_active?: boolean;
  is_flash_sale?: boolean;
  flash_sale_ends_at?: string | null;
  flash_sale_quota?: number | null;
  sold_count?: number;
  stock?: number;
  image_url: string;
  category?: {
    id?: number;
    name: string;
  } | string;
  seller?: {
    store_name: string;
  };
}

export default function ProductsPage() {
  const router = useRouter();
  const { addToCart: addToLocalCart } = useCart();
  const { t } = useLanguage();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const [addingCartId, setAddingCartId] = useState<number | null>(null);
  const [buyingId, setBuyingId] = useState<number | null>(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nttstorepi.mejatika.com/api';
  const DOMAIN_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

  useEffect(() => {
    productService
      .getProducts()
      .then((res: any) => {
        const productList = res?.data?.data || res?.data || res;
        setProducts(Array.isArray(productList) ? productList : []);
      })
      .catch((err) => {
        console.error('Gagal mengambil daftar produk:', err);
        setError(t('loadProductsError'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [t]);

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

  // Ekstrak daftar kategori unik dari data produk
  const categories = useMemo(() => {
    const setCat = new Set<string>();
    products.forEach((p) => {
      const catName =
        typeof p.category === 'object' ? p.category?.name : p.category;
      if (catName && catName.trim() !== '') {
        setCat.add(catName.trim());
      }
    });
    return Array.from(setCat);
  }, [products]);

  // Filter produk berdasarkan pencarian & kategori
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const catName =
        typeof p.category === 'object' ? p.category?.name : p.category;
      const matchesCategory =
        selectedCategory === 'ALL' || catName === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.seller?.store_name?.toLowerCase().includes(q);

      return matchesCategory && matchesQuery;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleAddToCart = async (product: Product) => {
    setAddingCartId(product.id);
    try {
      try {
        await cartService.addToCart(product.id, 1);
      } catch (err) {
        console.warn('API Cart error, falling back to Context state:', err);
      }

      const effectivePrice = getEffectivePricePi(product);

      addToLocalCart({
        id: String(product.id),
        name: product.name,
        category:
          (typeof product.category === 'object'
            ? product.category?.name
            : product.category) || 'Umum',
        priceIdr: 0,
        pricePi: effectivePrice,
        image: product.image_url,
        description: product.description,
        stock: product.stock ?? 10,
        rating: 5,
      });

      Swal.fire({
        title: t('successTitle'),
        text: t('addedToCart'),
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error('Gagal menambahkan ke keranjang:', err);
      Swal.fire(t('failedTitle'), err.message || t('addToCartError'), 'error');
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

      const effectivePrice = getEffectivePricePi(product);

      addToLocalCart({
        id: String(product.id),
        name: product.name,
        category:
          (typeof product.category === 'object'
            ? product.category?.name
            : product.category) || 'Umum',
        priceIdr: 0,
        pricePi: effectivePrice,
        image: product.image_url,
        description: product.description,
        stock: product.stock ?? 10,
        rating: 5,
      });

      router.push('/cart');
    } catch (err: any) {
      console.error('Gagal memproses Beli Langsung:', err);
      Swal.fire(t('failedTitle'), t('buyNowError'), 'error');
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Tombol Melayang Flash Sale (di luar kondisi loading agar tidak error JSX) */}
      <FlashSaleBanner />

      {/* Header & Tombol Kembali */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-amber-700 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {t('navHome')}
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            {t('allProducts')}
          </h1>
          <p className="text-xs text-gray-500 mt-1">{t('heroSubtitle')}</p>
        </div>
      </div>

      {/* Search Bar & Filter Kategori */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <SlidersHorizontal className="w-4 h-4 text-gray-400 shrink-0" />
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === 'ALL'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t('allCategories')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Konten Daftar Produk */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-gray-100 animate-pulse h-72 rounded-2xl"></div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-600 rounded-2xl text-center text-sm font-medium">
          {error}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center text-gray-500 bg-white border border-gray-100 rounded-2xl">
          <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm font-medium">{t('noProductsFound')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredProducts.map((product) => {
            const imgUrl = getFullImageUrl(product.image_url);
            const isAddingThis = addingCartId === product.id;
            const isBuyingThis = buyingId === product.id;

            const basePrice = Number(product.price_pi || 0);
            const effectivePrice = getEffectivePricePi(product);
            const isPromo = effectivePrice > 0 && effectivePrice < basePrice;
            const discountPct =
              product.discount_percentage ||
              (isPromo ? Math.round(((basePrice - effectivePrice) / basePrice) * 100) : 0);

            return (
              <div
                key={product.id}
                className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
              >
                <div>
                  <Link
                    href={`/products/${product.slug || product.id}`}
                    className="block h-44 w-full bg-gray-50 rounded-xl overflow-hidden mb-3 relative flex items-center justify-center border border-gray-100"
                  >
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={product.name}
                        className="w-full h-full object-cover relative z-10 hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : null}

                    {isPromo && (
                      <span className="absolute top-2 left-2 z-20 inline-flex items-center gap-0.5 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow">
                        <Zap className="w-3 h-3 fill-yellow-300 text-yellow-300" />
                        -{discountPct}%
                      </span>
                    )}

                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 z-0">
                      <Package className="w-8 h-8 mb-1 opacity-50" />
                      <span className="text-[10px] text-gray-400">{t('noImage')}</span>
                    </div>
                  </Link>

                  <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-full inline-block">
                    {product.seller?.store_name || t('defaultSellerName')}
                  </span>

                  <Link href={`/products/${product.slug || product.id}`}>
                    <h3 className="font-bold text-gray-900 mt-1.5 line-clamp-1 text-sm hover:text-amber-700 transition">
                      {product.name}
                    </h3>
                  </Link>

                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {product.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-1.5 min-w-0">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-xs font-bold ${isPromo ? 'text-red-600' : 'text-amber-600'}`}>π</span>
                        <span className={`text-sm font-extrabold truncate ${isPromo ? 'text-red-600' : 'text-amber-600'}`}>
                          {effectivePrice}
                        </span>
                      </div>
                      {isPromo && (
                        <span className="text-[11px] text-gray-400 line-through truncate">
                          π {basePrice}
                        </span>
                      )}
                    </div>
                    {typeof product.stock === 'number' && (
                      <span className="text-[11px] text-gray-400 shrink-0">
                        {t('stock')}: {product.stock}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-1.5 pt-1">
                    <button
                      type="button"
                      disabled={isAddingThis || isBuyingThis}
                      onClick={() => handleAddToCart(product)}
                      title={t('addToCart')}
                      className="bg-amber-100 hover:bg-amber-200 text-amber-800 p-2 rounded-xl transition flex items-center justify-center disabled:opacity-50"
                    >
                      {isAddingThis ? (
                        <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                      ) : (
                        <ShoppingCart className="w-4 h-4" />
                      )}
                    </button>

                    <Link
                      href={`/products/${product.slug || product.id}`}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-2.5 py-2 rounded-xl transition text-center flex-1"
                    >
                      {t('viewDetails')}
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
                      <span>{t('buyShort')}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
