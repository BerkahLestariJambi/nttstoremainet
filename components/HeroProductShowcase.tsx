'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getEffectivePricePi } from '@/services/productService';
import { useLanguage } from '@/context/LanguageContext';
import { Sparkles, Zap, ChevronLeft, ChevronRight, Package, ArrowUpRight } from 'lucide-react';

interface HeroProductShowcaseProps {
  products: any[];
}

export default function HeroProductShowcase({ products }: HeroProductShowcaseProps) {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nttstorepi.mejatika.com/api';
  const DOMAIN_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

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

  // Acak urutan produk saat pertama dimuat (maksimal 8 produk untuk showcase)
  const shuffledProducts = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) return [];
    const copy = [...products];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, 8);
  }, [products]);

  // Auto-play seperti video reel setiap 4 detik
  useEffect(() => {
    if (shuffledProducts.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % shuffledProducts.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [shuffledProducts.length, isPaused]);

  if (shuffledProducts.length === 0) return null;

  const activeProduct = shuffledProducts[currentIndex];
  const imgUrl = getFullImageUrl(activeProduct?.image_url);
  const basePrice = Number(activeProduct?.price_pi || 0);
  const effectivePrice = getEffectivePricePi(activeProduct);
  const isPromo = effectivePrice > 0 && effectivePrice < basePrice;
  const discountPct =
    activeProduct?.discount_percentage ||
    (isPromo ? Math.round(((basePrice - effectivePrice) / basePrice) * 100) : 0);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + shuffledProducts.length) % shuffledProducts.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % shuffledProducts.length);
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full max-w-[340px] mx-auto lg:ml-auto lg:mr-4 select-none"
    >
      {/* Efek Glow Latar Belakang */}
      <div className="absolute -inset-2 bg-gradient-to-tr from-amber-400/30 via-fuchsia-500/20 to-yellow-300/30 rounded-[28px] blur-xl pointer-events-none" />

      {/* Kartu Utama Glassmorphism */}
      <Link
        href={`/products/${activeProduct.slug || activeProduct.id}`}
        className="group relative block bg-white/15 backdrop-blur-md border border-white/25 rounded-3xl p-3.5 shadow-2xl overflow-hidden transition-transform duration-500 hover:scale-[1.02]"
      >
        {/* Area Visual Produk dengan Animasi Ken Burns (Zoom/Pan halus seperti video) */}
        <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-black/20 border border-white/15">
          {imgUrl ? (
            <img
              key={activeProduct.id}
              src={imgUrl}
              alt={activeProduct.name}
              className="w-full h-full object-cover animate-kenburns"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/50">
              <Package className="w-10 h-10 mb-1" />
              <span className="text-[10px]">{t('noImage')}</span>
            </div>
          )}

          {/* Overlay Gradien Bawah */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

          {/* Badge Status Atas */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
            {isPromo ? (
              <span className="inline-flex items-center gap-1 bg-red-600/95 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md animate-pulse">
                <Zap className="w-3 h-3 fill-yellow-300 text-yellow-300" />
                -{discountPct}% {t('promoTag') || 'PROMO'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-400/95 text-gray-950 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md">
                <Sparkles className="w-3 h-3" />
                NTT SPOTLIGHT
              </span>
            )}

            <span className="bg-black/45 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/15">
              {currentIndex + 1}/{shuffledProducts.length}
            </span>
          </div>

          {/* Tombol Navigasi Kiri & Kanan */}
          {shuffledProducts.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous product"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition backdrop-blur-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next product"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition backdrop-blur-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Info Produk & Harga di Bagian Bawah Gambar */}
          <div
            key={`info-${activeProduct.id}`}
            className="absolute bottom-2.5 left-3 right-3 text-white animate-slideUpFade"
          >
            <p className="text-[10px] text-amber-300 font-semibold truncate">
              {activeProduct.seller?.store_name || t('defaultSellerName')}
            </p>
            <div className="flex items-end justify-between gap-2 mt-0.5">
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm leading-tight truncate">
                  {activeProduct.name}
                </h3>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-sm font-black text-amber-400">
                    π {effectivePrice}
                  </span>
                  {isPromo && (
                    <span className="text-[11px] text-white/60 line-through">
                      π {basePrice}
                    </span>
                  )}
                </div>
              </div>

              <span className="shrink-0 w-7 h-7 rounded-full bg-amber-400 text-gray-950 flex items-center justify-center shadow-md group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </span>
            </div>
          </div>
        </div>

        {/* Indikator Progress Bar Seperti Video Story */}
        <div className="flex items-center gap-1.5 mt-2.5 px-1">
          {shuffledProducts.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              aria-label={`Slide ${idx + 1}`}
              className="h-1 flex-1 rounded-full bg-white/25 overflow-hidden"
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'bg-amber-400 w-full'
                    : idx < currentIndex
                    ? 'bg-white/70 w-full'
                    : 'w-0'
                }`}
              />
            </button>
          ))}
        </div>
      </Link>
    </div>
  );
}
