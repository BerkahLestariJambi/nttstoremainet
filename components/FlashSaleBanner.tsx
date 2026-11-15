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
  ChevronDown,
  ChevronUp,
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
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [addedId, setAddedId] = useState<number | null>(null);

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
    <div className="sticky top-16 z-30 mb-5 rounded-2xl bg-gradient-to-r from-amber-600/95 via-orange-600/95 to-red-600/95 backdrop-blur-md text-white shadow-lg shadow-orange-900/15 border border-amber-300/30 transition-all duration-300">
      {/* Compact Header Bar */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 sm:px-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-yellow-300 text-red-800 shrink-0 shadow-sm">
            <Zap className="w-4 h-4 fill-red-700 animate-pulse" />
          </div>
          <div className="flex items-center gap-2 truncate">
            <span className="font-black text-xs sm:text-sm uppercase tracking-wide truncate">
              {t('flashSaleTitle')}
            </span>
            <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-bold bg-black/25 px-2 py-0.5 rounded-full text-yellow-200">
              <Flame className="w-3 h-3 fill-yellow-300" /> {activeProducts.length} Promo
            </span>
          </div>
        </div>

        {/* Mini Countdown & Toggle Collapse */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-mono font-black ${
              isUrgent ? 'bg-red-950/70 text-yellow-300 animate-pulse' : 'bg-black/25 text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-yellow-300 mr-0.5 hidden xs:inline" />
            <span className="bg-white text-gray-900 px-1.5 py-0.5 rounded text-[11px]">
              {pad(timeLeft.hours)}
            </span>
            <span>:</span>
            <span className="bg-white text-gray-900 px-1.5 py-0.5 rounded text-[11px]">
              {pad(timeLeft.minutes)}
            </span>
            <span>:</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[11px] transition-transform duration-200 ${
                tickPulse ? 'scale-110 bg-yellow-300 text-red-900' : 'bg-white text-red-600'
              }`}
            >
              {pad(timeLeft.seconds)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-label="Toggle Flash Sale"
            className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 transition text-white"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Horizontal Mini-Cards Strip (Collapsible) */}
      {isExpanded && (
        <div className="px-3.5 pb-3 sm:px-5 sm:pb-3.5 pt-0.5">
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/30">
            {activeProducts.map((product) => {
              const originalPrice = Number(product.price_pi);
              const promoPrice = Number(product.discount_price_pi);
              const discountPct =
                product.discount_percentage ||
                Math.round(((originalPrice - promoPrice) / originalPrice) * 100);
              const isAdded = addedId === product.id;

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug || product.id}`}
                  className="group flex items-center gap-2.5 bg-white text-gray-900 rounded-xl p-2 min-w-[220px] sm:min-w-[245px] max-w-[260px] shrink-0 shadow-sm hover:shadow-md transition"
                >
                  {/* Thumbnail Mini */}
                  <div className="relative w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                    {product.image_url ? (
                      <img
                        src={resolveImage(product.image_url)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-400">
                        {t('noImage')}
                      </div>
                    )}
                    <span className="absolute top-0 left-0 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-br-lg">
                      -{discountPct}%
                    </span>
                  </div>

                  {/* Info Mini */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 truncate group-hover:text-amber-700">
                      {product.name}
                    </h4>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-sm font-black text-red-600">{promoPrice} π</span>
                      <span className="text-[10px] text-gray-400 line-through">
                        {originalPrice} π
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] font-semibold text-orange-600">
                        {t('stock')}: {product.stock}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(e, product.id)}
                        disabled={product.stock <= 0 || addingId === product.id}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1 transition ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-500 hover:bg-amber-600 text-white'
                        }`}
                      >
                        {isAdded ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <>
                            <ShoppingCart className="w-2.5 h-2.5" /> +
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
      )}
    </div>
  );
}
