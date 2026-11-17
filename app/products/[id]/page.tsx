'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowLeft, ShieldCheck, Truck, Star, Loader2 } from 'lucide-react';
import { productService } from '@/services/productService';
import { cartService } from '@/services/cartService';
import { useLanguage } from '@/context/LanguageContext';

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

  // 2. Tambahkan Produk ke Keranjang DB via API Laravel
  const handleAddToCart = async () => {
    if (!product?.id) return;
    setAdding(true);
    try {
      await cartService.addToCart(Number(product.id), qty);
      
      // Redirect ke halaman keranjang untuk melihat item yang baru tersimpan di DB
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
        <Link href="/" className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-2xl text-xs transition">
          {t('backToCatalog')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-amber-700 mb-6 font-medium text-sm transition"
      >
        <ArrowLeft className="w-4 h-4" /> {t('backToCatalog')}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="h-96 rounded-2xl overflow-hidden bg-gray-50 border relative">
          <img
            src={product.image_url || product.image || 'https://images.unsplash.com/photo-1606760227091-3dd850d492a6?w=800'}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full">
              {product.category?.name || product.category || 'NTT Product'}
            </span>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-2">
              {product.name}
            </h1>

            <div className="flex items-center gap-2 mt-2">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span className="text-sm font-bold text-gray-800">
                {product.rating || '4.9'}
              </span>
              <span className="text-gray-400 text-sm">
                • {t('stock')}: {product.sisa_stock ?? 10} pcs |{t('sold')}: :{product.sold ?? 10} Pcs
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

          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm font-medium text-gray-700">{t('quantity')}:</span>
              <div className="flex items-center border rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 font-bold transition text-xs"
                >
                  -
                </button>
                <span className="px-4 py-1.5 font-bold text-gray-800 text-xs">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(Math.min(product.stock || 99, qty + 1))}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 font-bold transition text-xs"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={adding}
              onClick={handleAddToCart}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-amber-200 disabled:opacity-50 text-xs"
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

            <div className="grid grid-cols-2 gap-4 mt-6 text-xs text-gray-500">
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
