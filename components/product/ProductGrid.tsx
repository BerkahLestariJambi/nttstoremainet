'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { productService } from '@/services/productService';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Package,
  ShoppingBag,
  ShoppingCart,
  Loader2,
  Plus,
  Minus,
  X,
  Star,
} from 'lucide-react';
import Swal from 'sweetalert2';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price_pi: string;
  discount_price_pi?: string | null;
  effective_price_pi?: number;
  is_promo_active?: boolean;
  image_url: string;
  stock?: number;
  sisa_stock?: number;
  sold?: number;
  sold_count?: number;
  reviews_count?: number;
  reviews_avg_rating?: number | string | null;
  seller?: {
    store_name: string;
  };
}

export default function ProductGrid() {
  const router = useRouter();
  const { addToCart: addToLocalCart } = useCart();
  const { t } = useLanguage();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [addingCartId, setAddingCartId] = useState<number | null>(null);
  const [buyingId, setBuyingId] = useState<number | null>(null);

  // State untuk modal pilih jumlah saat klik ikon keranjang
  const [selectedProductForCart, setSelectedProductForCart] = useState<Product | null>(null);
  const [customQty, setCustomQty] = useState<number>(1);

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
        setError(t('loadProductsError'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [t]);

  const getFullImageUrl = (url: string | null) => {
    if (!url || typeof url !== 'string' || url.trim() === '') return '';

    const cleanUrl = url.trim().replace(/\\/g, '/');

    if (
      (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) &&
      !cleanUrl.includes('nttstorepi.mejatika.com')
    ) {
      return cleanUrl;
    }

    const fileName = cleanUrl.split('/').filter(Boolean).pop();
    if (!fileName) return '';

    return `${DOMAIN_BASE_URL}/public/products/${fileName}`;
  };

  // Helper menghitung sisa stok, jumlah terjual, & rating ulasan
  const getProductMetrics = (product: Product) => {
    const sold = Number(product.sold_count ?? product.sold ?? 0);
    const remainingStock =
      product.sisa_stock !== undefined && product.sisa_stock !== null
        ? Number(product.sisa_stock)
        : Math.max(0, Number(product.stock ?? 0) - sold);

    const reviewCount = Number(product.reviews_count ?? 0);
    const avgRating =
      product.reviews_avg_rating !== null && product.reviews_avg_rating !== undefined
        ? Number(product.reviews_avg_rating)
        : 0;

    return {
      sold,
      remainingStock,
      reviewCount,
      avgRating,
    };
  };

  // Buka popup pemilih jumlah (default 1) saat ikon keranjang diklik
  const handleOpenQtyModal = (product: Product) => {
    const { remainingStock } = getProductMetrics(product);
    if (remainingStock <= 0) {
      Swal.fire('Stok Habis', 'Maaf, stok produk ini sedang kosong.', 'warning');
      return;
    }
    setSelectedProductForCart(product);
    setCustomQty(1);
  };

  const handleConfirmAddToCart = async () => {
    if (!selectedProductForCart) return;
    const product = selectedProductForCart;
    const { remainingStock } = getProductMetrics(product);
    const qtyToAdd = Math.max(1, Math.min(remainingStock || 1, customQty));

    setAddingCartId(product.id);
    try {
      await addToLocalCart(
        {
          id: String(product.id),
          product_id: product.id,
          name: product.name,
          category: 'Umum',
          priceIdr: 0,
          pricePi: Number(product.effective_price_pi ?? product.price_pi) || 0,
          image: product.image_url,
          image_url: product.image_url,
          description: product.description,
          stock: remainingStock,
          sisa_stock: remainingStock,
          rating: Number(product.reviews_avg_rating ?? 5) || 5,
        },
        qtyToAdd
      );

      setSelectedProductForCart(null);

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
    const { remainingStock } = getProductMetrics(product);
    if (remainingStock <= 0) {
      Swal.fire('Stok Habis', 'Maaf, stok produk ini sedang kosong.', 'warning');
      return;
    }

    setBuyingId(product.id);
    try {
      await addToLocalCart(
        {
          id: String(product.id),
          product_id: product.id,
          name: product.name,
          category: 'Umum',
          priceIdr: 0,
          pricePi: Number(product.effective_price_pi ?? product.price_pi) || 0,
          image: product.image_url,
          image_url: product.image_url,
          description: product.description,
          stock: remainingStock,
          sisa_stock: remainingStock,
          rating: Number(product.reviews_avg_rating ?? 5) || 5,
        },
        1
      );

      router.push('/cart');
    } catch (err: any) {
      console.error('Gagal memproses Beli Langsung:', err);
      Swal.fire(t('failedTitle'), t('buyNowError'), 'error');
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
        {t('noProductsFound')}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {products.map((product) => {
          const imgUrl = getFullImageUrl(product.image_url);
          const isAddingThis = addingCartId === product.id;
          const isBuyingThis = buyingId === product.id;
          const { sold, remainingStock, reviewCount, avgRating } = getProductMetrics(product);
          const isOutOfStock = remainingStock <= 0;

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
                    <span className="text-[10px] text-gray-400">{t('noImage')}</span>
                  </div>

                  {isOutOfStock && (
                    <div className="absolute inset-0 z-20 bg-black/50 flex items-center justify-center">
                      <span className="bg-red-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wide">
                        Stok Habis
                      </span>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-full inline-block">
                  {product.seller?.store_name || t('defaultSellerName')}
                </span>
                <h3 className="font-bold text-gray-900 mt-1.5 line-clamp-1 text-sm">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {product.description}
                </p>

                {/* Baris Rating Bintang & Jumlah Ulasan */}
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const filled = reviewCount > 0 && Math.round(avgRating) >= star;
                      return (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            filled
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-200 fill-gray-200'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <span className="text-[11px] font-bold text-gray-700">
                    {reviewCount > 0 ? avgRating.toFixed(1) : '0.0'}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    ({reviewCount} ulasan)
                  </span>
                </div>

                {/* Baris Sisa Stock & Terjual (Sold) */}
                <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-dashed border-gray-100">
                  <span
                    className={`font-semibold ${
                      isOutOfStock
                        ? 'text-red-600'
                        : remainingStock <= 5
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    Sisa Stok: <strong>{remainingStock}</strong>
                  </span>
                  <span className="text-gray-500 font-medium">
                    Terjual: <strong className="text-gray-800">{sold}</strong>
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-col gap-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-bold text-amber-600">π</span>
                  <span className="text-sm font-extrabold text-amber-600 truncate">
                    {product.is_promo_active && product.discount_price_pi
                      ? product.discount_price_pi
                      : product.price_pi}
                  </span>
                  {product.is_promo_active && product.discount_price_pi && (
                    <span className="text-[11px] text-gray-400 line-through ml-1">
                      π {product.price_pi}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-1.5 pt-1">
                  <button
                    type="button"
                    disabled={isAddingThis || isBuyingThis || isOutOfStock}
                    onClick={() => handleOpenQtyModal(product)}
                    title={t('addToCart')}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-800 p-2 rounded-xl transition flex items-center justify-center disabled:opacity-50 cursor-pointer"
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
                    {t('viewDetails')}
                  </Link>

                  <button
                    type="button"
                    disabled={isBuyingThis || isAddingThis || isOutOfStock}
                    onClick={() => handleBuyNow(product)}
                    className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition flex items-center justify-center gap-1 shadow-sm disabled:opacity-50 flex-1 cursor-pointer"
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

      {/* Modal Pilih Jumlah Produk Saat Klik Ikon Keranjang */}
      {selectedProductForCart && (() => {
        const { remainingStock } = getProductMetrics(selectedProductForCart);
        return (
          <div
            onClick={() => setSelectedProductForCart(null)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-xs w-full p-5 shadow-2xl border border-gray-100 space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  {getFullImageUrl(selectedProductForCart.image_url) && (
                    <img
                      src={getFullImageUrl(selectedProductForCart.image_url)}
                      alt={selectedProductForCart.name}
                      className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 truncate">
                      {selectedProductForCart.name}
                    </h4>
                    <p className="text-xs font-extrabold text-amber-600 mt-0.5">
                      π{' '}
                      {selectedProductForCart.is_promo_active &&
                      selectedProductForCart.discount_price_pi
                        ? selectedProductForCart.discount_price_pi
                        : selectedProductForCart.price_pi}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Sisa stok: <strong className="text-gray-800">{remainingStock}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProductForCart(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 rounded-2xl">
                <span className="text-xs font-semibold text-gray-600">Quantity</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCustomQty((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-amber-50 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-extrabold text-gray-900 w-6 text-center">
                    {customQty}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCustomQty((q) => Math.min(Math.max(1, remainingStock), q + 1))
                    }
                    className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-amber-50 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmAddToCart}
                disabled={addingCartId === selectedProductForCart.id}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {addingCartId === selectedProductForCart.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4" />
                )}
                <span>
                  {t('addToCart')} ({customQty})
                </span>
              </button>
            </div>
          </div>
        );
      })()}
    </>
  );
}
