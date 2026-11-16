'use client';

import { useEffect, useState } from 'react';
import ProductGrid from '@/components/product/ProductGrid';
import HeroProductShowcase from '@/components/HeroProductShowcase';
import { useLanguage } from '@/context/LanguageContext';
import { productService } from '@/services/productService';
import FlashSaleBanner from '@/components/FlashSaleBanner';

export default function HomePage() {
  const { t } = useLanguage();
  const [showcaseProducts, setShowcaseProducts] = useState<any[]>([]);

  // Ambil daftar produk untuk animasi showcase acak di Hero Banner
  useEffect(() => {
    productService
      .getProducts()
      .then((res: any) => {
        const productList = res?.data?.data || res?.data || res;
        setShowcaseProducts(Array.isArray(productList) ? productList : []);
      })
      .catch((err) => {
        console.error('Gagal memuat produk untuk Hero Showcase:', err);
      });
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Banner Murni Video-Style Product Slider */}
      <HeroProductShowcase products={showcaseProducts} />

      {/* Katalog Produk Unggulan */}
      <section>
        <FlashSaleBanner initialProducts={showcaseProducts} />
        <h2 className="text-2xl font-bold mb-6 text-gray-900">{t('featuredProducts')}</h2>
        <ProductGrid />
      </section>
    </div>
  );
}
