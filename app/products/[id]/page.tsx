'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Star,
  Loader2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { productService } from '@/services/productService';
import { cartService } from '@/services/cartService';
import { useLanguage } from '@/context/LanguageContext';
import ProductReviewsSection from '@/components/ProductReviewsSection';

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const resolvedParams = React.use(params);
  const productId = resolvedParams.id;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [adding, setAdding] = useState<boolean>(false);
  const [qty, setQty] = useState<number>(1);
  const [showReviews, setShowReviews] = useState<boolean>(false);

  // State statistik ulasan dinamis dari tabel product_reviews
  const [reviewStats, setReviewStats] = useState<{
    averageRating: number;
    totalReviews: number;
  }>({
    averageRating: 0,
    totalReviews: 0,
  });

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nttstorepi.mejatika.com/api';

  // 1. Ambil Detail Produk dari API Database Laravel
  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        const res: any = await productService.getProductById(productId);
        const item = res?.data?.data || res?.data || res;
        setProduct(item);
      } catch (err) {
        console.error('Gagal mengambil detail produk:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [productId]);

  // 2. Ambil Rata-Rata Bintang & Jumlah Ulasan Asli dari Tabel product_reviews
  useEffect(() => {
    if (!product?.id) return;

    fetch(`${API_BASE_URL}/products/${product.id}/reviews`, {
      headers: { Accept: 'application/json' },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json?.success && json.data) {
          setReviewStats({
            averageRating: Number(json.data.average_rating || 0),
            totalReviews: Number(json.data.total_reviews || 0),
          });
        }
      })
      .catch((err) => {
        console.error('Gagal mengambil statistik ulasan:', err);
      });
  }, [product?.id, API_BASE_URL]);

  // 3. Tambahkan Produk ke Keranjang DB via API Laravel
  const handleAddToCart = async () => {
    if (!product?.id) return;
    setAdding(true);
    try {
      await cartService.addToCart(Number(product.id), qty);
      router.push('/cart');
    } catch (err: any) {
      console.error('Gagal menambahkan ke keranjang DB:', err);
      alert(err.message || t('addToCartError'));
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-16 text-center text-gray-500 flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-xs">{t('loadingProductDetail')}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-gray-100 rounded-3xl shadow-sm text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-2">{t('productNotFound')}</h2>
        <p className="text-xs text-gray-500 mb-6">{t('productNotFoundDesc')}</p>
        <Link
          href="/"
          className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-2xl text-xs transition"
        >
          {t('backToCatalog')}
        </Link>
      </div>
    );
  }

  const displayRating =
    reviewStats.totalReviews > 0 ? reviewStats.averageRating.toFixed(1) : '0.0';

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-amber-700 mb-6 font-medium text-sm transition"
      >
        <ArrowLeft className="w-4 h-4" /> {t('backToCatalog')}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm items-start">
        {/* Kolom Kiri: Gambar Produk */}
        <div className="h-96 rounded-2xl overflow-hidden bg-gray-50 border relative md:sticky md:top-6">
          <img
            src={
              product.image_url ||
              product.image ||
              'https://images.unsplash.com/photo-1606760227091-3dd850d492a6?w=800'
            }
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Kolom Kanan: Info Produk, Aksi, & Toggle Show/Hide Review */}
        <div className="flex flex-col justify-between">
          <div>
            <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full">
              {product.category?.name || product.category || 'NTT Product'}
            </span>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-2">
              {product.name}
            </h1>

            {/* Rating Bintang & Jumlah Ulasan Dinamis dari Tabel product_reviews */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <div className="inline-flex items-center gap-1">
                <Star
                  className={`w-4 h-4 ${
                    reviewStats.totalReviews > 0
                      ? 'fill-amber-500 text-amber-500'
                      : 'text-gray-300'
                  }`}
                />
                <span className="text-sm font-bold text-gray-800">{displayRating}</span>
                <button
                  type="button"
                  onClick={() => setShowReviews(true)}
                  className="text-xs text-amber-700 hover:underline font-semibold cursor-pointer"
                >
                  ({reviewStats.totalReviews} ulasan)
                </button>
              </div>
              <span className="text-gray-400 text-sm">
                • {t('stock')}: {product.sisa_stock ?? 10} pcs | {t('sold')}: {product.sold ?? 0} pcs
              </span>
            </div>

            <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <p className="text-xs text-amber-700 font-semibold uppercase">
                {t('piEcosystemPrice')}
              </p>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl font-black text-amber-600">
                  {(Number(product.price_pi || product.pricePi || 0) * qty).toFixed(4)} π
                </span>
                {product.priceIdr && (
                  <span className="text-sm text-gray-500 font-medium">
                    (Rp {(Number(product.priceIdr) * qty).toLocaleString('id-ID')})
                  </span>
                )}
              </div>
            </div>

            <p className="text-gray-600 mt-4 leading-relaxed text-sm">
              {product.description || t('defaultProductDesc')}
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">{t('quantity')}:</span>
              <div className="flex items-center border rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 font-bold transition text-xs cursor-pointer"
                >
                  -
                </button>
                <span className="px-4 py-1.5 font-bold text-gray-800 text-xs">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(Math.min(product.stock || 99, qty + 1))}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 font-bold transition text-xs cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={adding}
              onClick={handleAddToCart}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-amber-200 disabled:opacity-50 text-xs cursor-pointer"
            >
              {adding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {t('savingToDb')}
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" /> + {t('addToCart')}
                </>
              )}
            </button>

            {/* Tombol Show / Hide Ulasan & Testimoni di Kanan Gambar */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowReviews((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 hover:bg-amber-50/70 border border-gray-200 hover:border-amber-200 text-xs font-bold text-gray-800 transition cursor-pointer"
              >
                <span className="inline-flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-500" />
                  <span>
                    {showReviews
                      ? `Sembunyikan Ulasan (${reviewStats.totalReviews})`
                      : `Lihat Ulasan & Testimoni (${reviewStats.totalReviews} ulasan • ★ ${displayRating})`}
                  </span>
                </span>
                {showReviews ? (
                  <ChevronUp className="w-4 h-4 text-amber-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {/* Area Daftar Review dengan Scroll Vertikal */}
              {showReviews && (
                <div className="mt-3 max-h-[380px] overflow-y-auto pr-1 rounded-2xl border border-gray-100 bg-gray-50/40 p-2 [&>div]:mt-0 [&>div]:p-4 [&>div]:shadow-none">
                 {/* <ProductReviewsSection productId={product.id} */}
                  <ProductReviewsSection
  productId={product.id}
  sellerUserId={product.user_id ?? product.seller?.user_id}
/>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-600" /> {t('securePiSdk')}
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" /> {t('shippedFromNtt')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
