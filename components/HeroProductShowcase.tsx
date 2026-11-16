'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getEffectivePricePi } from '@/services/productService';
import { useLanguage } from '@/context/LanguageContext';
import { Sparkles, Zap, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';

interface HeroProductShowcaseProps {
  products: any[];
  children: React.ReactNode;
}

export default function HeroProductShowcase({ products, children }: HeroProductShowcaseProps) {
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

  // Acak urutan produk secara dinamis (maksimal 8 produk untuk reel)
  const shuffledProducts = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) return [];
    const copy = [...products].filter((p) => p?.image_url);
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, 8);
  }, [products]);

  // Transisi otomatis setiap 4.5 detik seperti video
  useEffect(() => {
    if (shuffledProducts.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % shuffledProducts.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [shuffledProducts.length, isPaused]);

  const activeProduct = shuffledProducts[currentIndex];
  const imgUrl = activeProduct ? getFullImageUrl(activeProduct.image_url) : '';
  const basePrice = Number(activeProduct?.price_pi || 0);
  const effectivePrice = activeProduct ? getEffectivePricePi(activeProduct) : 0;
  const isPromo = effectivePrice > 0 && effectivePrice < basePrice;
  const discountPct =
    activeProduct?.discount_percentage ||
    (isPromo ? Math.round(((basePrice - effectivePrice) / basePrice) * 100) : 0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + shuffledProducts.length) % shuffledProducts.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % shuffledProducts.length);
  };

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative overflow-hidden bg-gradient-to-r from-amber-800 via-amber-900 to-purple-950 text-white rounded-3xl shadow-xl min-h-[360px] md:min-h-[420px] flex flex-col justify-between"
    >
      {/* Background Video-Style Full Gambar Produk Acak */}
      {activeProduct && imgUrl && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            key={activeProduct.id}
            src={imgUrl}
            alt={activeProduct.name}
            className="w-full h-full object-cover object-center animate-kenburns opacity-65"
          />
          {/* Overlay Gradien Gelap & Hangat supaya teks Hero tetap kontras & terbaca jelas */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-amber-950/70 to-purple-950/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        </div>
      )}

      {/* Progress Bar Story di Bagian Paling Atas Hero */}
      {shuffledProducts.length > 1 && (
        <div className="relative z-20 flex items-center gap-1.5 px-6 pt-4">
          {shuffledProducts.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Slide ${idx + 1}`}
              className="h-1 flex-1 rounded-full bg-white/25 overflow-hidden cursor-pointer"
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'bg-yellow-400 w-full'
                    : idx < currentIndex
                    ? 'bg-white/75 w-full'
                    : 'w-0'
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Konten Utama Hero (Teks Welcome & Tombol Auth/Explore) */}
      <div className="relative z-10 p-6 sm:p-8 md:p-12 flex-1 flex flex-col justify-center">
        {children}
      </div>

      {/* Kartu Mini Info Produk Aktif & Kontrol Slide di Bagian Bawah Hero */}
      {activeProduct && (
        <div className="relative z-20 px-6 sm:px-8 md:px-12 pb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            key={`pill-${activeProduct.id}`}
            href={`/products/${activeProduct.slug || activeProduct.id}`}
            className="group inline-flex items-center gap-3 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 rounded-2xl px-3.5 py-2 transition animate-slideUpFade max-w-full sm:max-w-md"
          >
            {imgUrl && (
              <img
                src={imgUrl}
                alt={activeProduct.name}
                className="w-10 h-10 rounded-xl object-cover border border-white/25 shrink-0"
              />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                {isPromo ? (
                  <span className="inline-flex items-center gap-0.5 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                    <Zap className="w-2.5 h-2.5 fill-yellow-300 text-yellow-300" />
                    -{discountPct}%
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 bg-yellow-400 text-gray-950 text-[9px] font-black px-1.5 py-0.5 rounded">
                    <Sparkles className="w-2.5 h-2.5" />
                    FEATURED
                  </span>
                )}
                <span className="text-[10px] text-amber-200 truncate">
                  {activeProduct.seller?.store_name || t('defaultSellerName')}
                </span>
              </div>
              <p className="text-xs font-bold text-white truncate mt-0.5">
                {activeProduct.name}{' '}
                <span className="text-yellow-300 font-extrabold ml-1">
                  π {effectivePrice}
                </span>
              </p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-yellow-300 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>

          {/* Tombol Geser Slide Kiri / Kanan */}
          {shuffledProducts.length > 1 && (
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous slide"
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md border border-white/20 flex items-center justify-center transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next slide"
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md border border-white/20 flex items-center justify-center transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
