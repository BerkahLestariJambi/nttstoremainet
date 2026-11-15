'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { productService } from '@/services/productService';
import { cartService } from '@/services/cartService';
import { useLanguage } from '@/context/LanguageContext';
import {
  Zap,
  ShoppingCart,
  Flame,
  X,
  Check,
  Clock,
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
  logoUrl?: string;
}

export default function FlashSaleBanner({
  initialProducts,
  logoUrl = '/logo.png', // Sesuaikan dengan path logo NTTStorePi di folder public/ (misal: /logo.png atau /images/logo.png)
}: FlashSaleBannerProps) {
  const { t } = useLanguage();

  const [products, setProducts] = useState<FlashSaleProduct[]>(initialProducts || []);
  const [loading, setLoading] = useState<boolean>(!initialProducts);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [addedId, setAddedId] = useState<number | null>(null);
  const [logoError, setLogoError] = useState<boolean>(false);

  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMs: 0,
  });
  const [tickPulse, setTickPulse] = useState(false);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
      setLoading(false);
      return;
    }

    const fetchFlashSales = async () => {
      setLoading(true);
      try {
        const res: any =
          typeof (productService as any).getFlashSales === 'function'
            ? await (productService as any).getFlashSales()
            : await productService.getProducts();

        const list = Array.isArray(res) ? res : res?.data || [];
        setProducts(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Gagal memuat Flash Sale:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFlashSales();
  }, [initialProducts]);

  const activeProducts = products.filter((p) => {
    const orig = Number(p.price_pi || 0);
    const disc = Number(p.discount_price_pi || 0);
    if (!disc || disc >= orig || p.stock <= 0) return false;
    if (p.flash_sale_ends_at && new Date(p.flash_sale_ends_at).getTime() <= Date.now()) {
      return false;
    }
    return true;
  });

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

  useEffect(() => {
    if (activeProducts.length === 0) return;

    const updateCountdown = () => {
      const diff = targetEndTimestamp - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, totalMs: 0 });
        return;
      }

      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        totalMs: diff,
      });

      setTickPulse(true);
      setTimeout(() => setTickPulse(false), 250);
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
      setTimeout(() => setAddedId(null), 1500);
    } catch (err: any) {
      alert(err?.message || t('addToCartError'));
    } finally {
      setAddingId(null);
    }
  };

  if (loading || activeProducts.length === 0) return null;

  const pad = (n: number) => String(n).padStart(2, '0');
  const isUrgent = timeLeft.totalMs > 0 && timeLeft.totalMs < 15 * 60 * 1000;
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/api\/?$/, '');

  const resolveImage = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <>
      {/* 1. TOMBOL MELINGKAR MELAYANG DI KANAN TENGAH DENGAN BACKGROUND LOGO NTTSTOREPI */}
      <div className="fixed right-3 sm:right-5 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Flash Sale NTTStorePi"
          className="group relative flex flex-col items-center justify-center focus:outline-none"
        >
          {/* Efek Cincin Cahaya Berdenyut (Pulse Halo) */}
          <span
            className={`absolute inset-0 w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full blur-md opacity-75 transition-opacity group-hover:opacity-100 animate-pulse ${
              isUrgent
                ? 'bg-gradient-to-tr from-red-600 via-orange-500 to-yellow-400'
                : 'bg-gradient-to-tr from-amber-500 via-orange-500 to-red-600'
            }`}
          />

          {/* Lingkaran Utama dengan Background Logo NTTStorePi */}
          <div
            className={`relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full overflow-hidden border-[3px] shadow-2xl transition-transform duration-300 group-hover:scale-110 group-active:scale-95 bg-white flex items-center justify-center ${
              isUrgent ? 'border-red-500' : 'border-amber-400'
            }`}
          >
            {/* Gambar Logo NTTStorePi */}
            {!logoError ? (
              <img
                src={logoUrl}
                alt="NTTStorePi Flash Sale"
                onError={() => setLogoError(true)}
                className="w-full h-full object-cover p-1 group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 flex items-center justify-center text-white font-black text-xs">
                NTT π
              </div>
            )}

            {/* Overlay Gradien Tipis + Ikon Petir di Sudut Bawah */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <span className="absolute bottom-1 flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider text-yellow-300 drop-shadow">
              <Zap className="w-2.5 h-2.5 fill-yellow-300 text-yellow-300 animate-bounce" />
              FLASH
            </span>
          </div>

          {/* Badge Jumlah Produk Promo di Pojok Kiri Atas Lingkaran */}
          <span className="absolute -top-1 -left-1 flex h-5 min-w-5 items-center justify-center px-1.5 rounded-full bg-red-600 text-white text-[10px] font-black border-2 border-white shadow-md">
            {activeProducts.length}
          </span>

          {/* Pill Live Countdown Timer Menempel di Bawah Lingkaran */}
          <div
            className={`-mt-2 relative z-10 flex items-center gap-0.5 px-2 py-0.5 rounded-full font-mono font-black text-[10px] sm:text-[11px] text-white shadow-lg border border-yellow-300/80 ${
              isUrgent
                ? 'bg-red-700 animate-pulse'
                : 'bg-gradient-to-r from-amber-600 via-orange-600 to-red-600'
            }`}
          >
            <span>{pad(timeLeft.hours)}</span>
            <span className="text-yellow-300">:</span>
            <span>{pad(timeLeft.minutes)}</span>
            <span className="text-yellow-300">:</span>
            <span
              className={`inline-block transition-transform duration-200 ${
                tickPulse ? 'scale-125 text-yellow-300' : 'scale-100 text-white'
              }`}
            >
              {pad(timeLeft.seconds)}
            </span>
          </div>
        </button>
      </div>

      {/* 2. POP-UP DRAWER / MODAL DAFTAR PRODUK FLASH SALE SAAT TOMBOL DIKLIK */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full sm:max-w-lg max-h-[82vh] bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-yellow-300 text-red-800 rounded-xl">
                  <Zap className="w-5 h-5 fill-red-700 animate-bounce" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg uppercase tracking-wide">
                    {t('flashSaleTitle')}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-amber-100 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-yellow-300" />
                    <span>{t('endsInLabel')}:</span>
                    <span className="font-mono font-black bg-black/25 px-2 py-0.5 rounded text-yellow-200">
                      {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full bg-white/15 hover:bg-white/25 transition text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Daftar Produk Promo */}
            <div className="p-4 overflow-y-auto space-y-3 divide-y divide-gray-100">
              {activeProducts.map((product) => {
                const originalPrice = Number(product.price_pi);
                const promoPrice = Number(product.discount_price_pi);
                const discountPct =
                  product.discount_percentage ||
                  Math.round(((originalPrice - promoPrice) / originalPrice) * 100);
                const soldCount = Number(product.sold ?? product.sold_count ?? 0);
                const isAdded = addedId === product.id;

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug || product.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3.5 pt-3 first:pt-0 group"
                  >
                    <div className="relative w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                      {product.image_url ? (
                        <img
                          src={resolveImage(product.image_url)}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                          {t('noImage')}
                        </div>
                      )}
                      <span className="absolute top-1 left-1 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-lg shadow">
                        -{discountPct}%
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-gray-400 truncate">
                        {product.seller?.store_name || t('defaultSellerName')}
                      </p>
                      <h4 className="font-bold text-sm text-gray-900 line-clamp-1 group-hover:text-amber-700">
                        {product.name}
                      </h4>

                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-base font-black text-red-600">{promoPrice} π</span>
                        <span className="text-xs text-gray-400 line-through">{originalPrice} π</span>
                      </div>

                      <div className="flex items-center justify-between mt-1.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600">
                          <Flame className="w-3 h-3 fill-orange-500" />
                          {t('sold')} {soldCount} • {t('stock')}: {product.stock}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleQuickAdd(e, product.id)}
                          disabled={product.stock <= 0 || addingId === product.id}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition ${
                            isAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-500 hover:bg-amber-600 text-white'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> {t('addedToCart')}
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-3.5 h-3.5" /> {t('grabDealBtn')}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
