'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { productService } from '@/services/productService';
import { cartService } from '@/services/cartService';
import { useLanguage } from '@/context/LanguageContext';
import {
  Zap,
  Clock,
  ShoppingCart,
  Flame,
  ChevronRight,
  Sparkles,
  Check,
} from 'lucide-react';

export interface FlashSaleProduct {
  id: number;
  slug?: string;
  name: string;
  price_pi: number | string;
  discount_price_pi?: number | string | null;
  effective_price_pi?: number | string;
  discount_percentage?: number;
  is_flash_sale?: boolean;
  flash_sale_ends_at?: string | null;
  flash_sale_quota?: number | null;
  sold?: number;
  sold_count?: number;
  stock: number;
  image_url?: string;
  seller?: {
    id?: number;
    store_name?: string;
  };
}

interface FlashSaleBannerProps {
  initialProducts?: FlashSaleProduct[];
}

export default function FlashSaleBanner({ initialProducts }: FlashSaleBannerProps) {
  const { t } = useLanguage();

  const [products, setProducts] = useState<FlashSaleProduct[]>(initialProducts || []);
  const [loading, setLoading] = useState<boolean>(!initialProducts);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [addedId, setAddedId] = useState<number | null>(null);

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMs: 0,
  });
  const [tickPulse, setTickPulse] = useState(false);

  // Fetch data Flash Sale dari Laravel API
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
      setLoading(false);
      return;
    }

    const fetchFlashSales = async () => {
      setLoading(true);
      try {
        const res: any = await productService.getFlashSales();
        const list = res?.data || res || [];
        setProducts(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Gagal memuat Flash Sale:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFlashSales();
  }, [initialProducts]);

  // Filter hanya promo yang masih aktif & stok > 0
  const activeProducts = products.filter((p) => {
    const orig = Number(p.price_pi || 0);
    const disc = Number(p.discount_price_pi || 0);
    if (!disc || disc >= orig || p.stock <= 0) return false;
    if (p.flash_sale_ends_at && new Date(p.flash_sale_ends_at).getTime() <= Date.now()) {
      return false;
    }
    return true;
  });

  // Cari waktu berakhir terdekat (atau default akhir hari ini jika flash_sale_ends_at null)
  const targetEndTimestamp = (() => {
    const timestamps = activeProducts
      .map((p) => (p.flash_sale_ends_at ? new Date(p.flash_sale_ends_at).getTime() : 0))
      .filter((ts) => ts > Date.now())
      .sort((a, b) => a - b);

    if (timestamps.length > 0) return timestamps[0];

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay.getTime();
  })();

  // Live Countdown Timer per detik dengan efek animasi tick
  useEffect(() => {
    if (activeProducts.length === 0) return;

    const updateCountdown = () => {
      const diff = targetEndTimestamp - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        totalMs: diff,
      });

      setTickPulse(true);
      setTimeout(() => setTickPulse(false), 300);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetEndTimestamp, activeProducts.length]);

  const handleQuickAdd = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (addingId === productId) return;

    setAddingId(productId);
    try {
      await cartService.addToCart(productId, 1);
      setAddedId(productId);
      setTimeout(() => setAddedId(null), 1800);
    } catch (err: any) {
      alert(err?.message || t('addToCartError'));
    } finally {
      setAddingId(null);
    }
  };

  if (loading) {
    return (
      <div className="my-8 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-red-500/15 border border-amber-200/60 p-6 animate-pulse">
        <div className="h-7 w-56 bg-amber-200/70 rounded-xl mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-white/80 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (activeProducts.length === 0) return null;

  const pad = (n: number) => String(n).padStart(2, '0');
  const isUrgent = timeLeft.totalMs > 0 && timeLeft.totalMs < 15 * 60 * 1000; // < 15 menit
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/api\/?$/, '');

  const resolveImage = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <section className="relative my-8 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 via-orange-600 to-red-700 p-5 sm:p-8 text-white shadow-xl shadow-orange-200/60">
      {/* Animasi Ornamen Cahaya Background */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-yellow-300/20 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-red-400/25 blur-3xl animate-pulse" />

      {/* Header Flash Sale & Live Animated Timer */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-yellow-400 text-red-900 shadow-lg shadow-yellow-500/30">
            <Zap className="w-7 h-7 sm:w-8 sm:h-8 fill-red-700 text-red-800 animate-bounce" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white" />
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight uppercase drop-shadow-sm">
                {t('flashSaleTitle')}
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-extrabold bg-white text-red-700 px-2.5 py-0.5 rounded-full shadow-sm">
                <Sparkles className="w-3 h-3 text-amber-500" /> LIVE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-amber-100 mt-0.5">
              {t('flashSaleSubtitle')}
            </p>
          </div>
        </div>

        {/* Box Countdown Timer */}
        <div
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border backdrop-blur-md transition-colors ${
            isUrgent
              ? 'bg-red-950/60 border-yellow-300 animate-pulse'
              : 'bg-black/25 border-white/20'
          }`}
        >
          <Clock className="w-4 h-4 text-yellow-300 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-100">
            {t('endsInLabel')}
          </span>

          <div className="flex items-center gap-1.5 font-mono font-black text-sm sm:text-base">
            {timeLeft.days > 0 && (
              <>
                <span className="bg-white text-gray-900 px-2 py-1 rounded-lg shadow">
                  {timeLeft.days}d
                </span>
                <span className="text-yellow-300">:</span>
              </>
            )}

            <span className="bg-white text-gray-900 px-2.5 py-1 rounded-lg shadow">
              {pad(timeLeft.hours)}
            </span>
            <span className="text-yellow-300 animate-pulse">:</span>
            <span className="bg-white text-gray-900 px-2.5 py-1 rounded-lg shadow">
              {pad(timeLeft.minutes)}
            </span>
            <span className="text-yellow-300 animate-pulse">:</span>
            <span
              className={`px-2.5 py-1 rounded-lg shadow transition-transform duration-200 ${
                tickPulse
                  ? 'scale-110 bg-yellow-300 text-red-900'
                  : 'scale-100 bg-white text-red-600'
              }`}
            >
              {pad(timeLeft.seconds)}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Produk Flash Sale */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {activeProducts.map((product) => {
          const originalPrice = Number(product.price_pi);
          const promoPrice = Number(product.discount_price_pi);
          const discountPct =
            product.discount_percentage ||
            Math.round(((originalPrice - promoPrice) / originalPrice) * 100);

          const soldCount = Number(product.sold ?? product.sold_count ?? 0);
          const totalQuota = Number(
            product.flash_sale_quota || soldCount + Number(product.stock || 0)
          );
          const soldPct =
            totalQuota > 0 ? Math.min(100, Math.round((soldCount / totalQuota) * 100)) : 25;
          const almostGone = soldPct >= 75 || product.stock <= 3;

          const isAdded = addedId === product.id;
          const isAdding = addingId === product.id;

          return (
            <Link
              key={product.id}
              href={`/products/${product.slug || product.id}`}
              className="group relative bg-white text-gray-900 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
            >
              <div>
                {/* Gambar Produk */}
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={resolveImage(product.image_url)}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                      {t('noImage')}
                    </div>
                  )}

                  {/* Ribbon Diskon Kilat */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-0.5 bg-gradient-to-r from-red-600 to-orange-500 text-white text-[11px] sm:text-xs font-black px-2.5 py-1 rounded-xl shadow-md">
                    <Zap className="w-3 h-3 fill-yellow-300 text-yellow-300" />
                    -{discountPct}%
                  </div>

                  {/* Badge Hampir Habis */}
                  {almostGone && (
                    <span className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-sm text-yellow-300 text-[10px] font-bold px-2 py-0.5 rounded-lg animate-pulse">
                      🔥 {t('almostSoldOutBadge')}
                    </span>
                  )}
                </div>

                {/* Info Produk */}
                <div className="p-3.5 pb-2">
                  <p className="text-[11px] font-medium text-gray-400 truncate">
                    {product.seller?.store_name || t('defaultSellerName')}
                  </p>
                  <h3 className="font-bold text-xs sm:text-sm text-gray-900 line-clamp-2 min-h-[2.25rem] mt-0.5 group-hover:text-amber-700 transition-colors">
                    {product.name}
                  </h3>

                  {/* Harga Promo & Harga Coret */}
                  <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
                    <span className="text-base sm:text-lg font-black text-red-600">
                      {promoPrice} π
                    </span>
                    <span className="text-[11px] text-gray-400 line-through">
                      {originalPrice} π
                    </span>
                  </div>

                  {/* Progress Bar Kuota Terjual Beranimasi */}
                  <div className="mt-3">
                    <div className="relative w-full h-4 bg-red-100 rounded-full overflow-hidden flex items-center justify-center">
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(18, soldPct)}%` }}
                      />
                      <span className="relative z-10 text-[10px] font-extrabold text-white drop-shadow flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-yellow-300 text-yellow-200" />
                        {t('sold')} {soldCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tombol Quick Add to Cart */}
              <div className="p-3.5 pt-2">
                <button
                  type="button"
                  onClick={(e) => handleQuickAdd(e, product.id)}
                  disabled={product.stock <= 0 || isAdding}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                    isAdded
                      ? 'bg-emerald-600 text-white scale-95'
                      : 'bg-amber-500 hover:bg-amber-600 active:scale-95 text-white'
                  } disabled:opacity-50`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> {t('addedToCart')}
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-3.5 h-3.5" />
                      {product.stock > 0 ? t('grabDealBtn') : t('outOfStock')}
                    </>
                  )}
                </button>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer Link ke Semua Produk */}
      <div className="relative z-10 mt-5 flex justify-end">
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-yellow-200 hover:text-white transition"
        >
          {t('viewAllPromoProducts')} <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
