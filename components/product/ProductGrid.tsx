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
  MessageSquare,
  CheckCircle2,
  Store,
  ExternalLink,
  Radio,
} from 'lucide-react';
import Swal from 'sweetalert2';

interface Product {
  id: number;
  seller_id?: number;
  name: string;
  slug: string;
  description: string;
  price_pi: string | number;
  discount_price_pi?: string | number | null;
  effective_price_pi?: string | number;
  is_promo_active?: boolean;
  image_url: string;
  stock?: number;
  sisa_stock?: number;
  sold?: number;
  sold_count?: number;
  reviews_count?: number;
  reviews_avg_rating?: number | string | null;
  seller?: {
    id?: number;
    store_name: string;
  };
}

interface ActiveLiveInfo {
  id: number;
  seller_id: number;
  room_name: string;
  title: string;
  viewer_count: number;
  pinned_product_id?: number | null;
}

interface ReviewMedia {
  type: 'image' | 'video';
  url: string;
}

interface ProductReviewItem {
  id: number;
  rating: number;
  comment: string | null;
  media?: ReviewMedia[];
  seller_reply?: string | null;
  created_at: string;
  user?: {
    name?: string;
    username?: string;
  };
  replies?: {
    id: number;
    comment: string;
    is_seller: boolean;
    created_at: string;
    user?: {
      name?: string;
      username?: string;
    };
  }[];
}

export default function ProductGrid() {
  const router = useRouter();
  const { addToCart: addToLocalCart } = useCart();
  const { t } = useLanguage();

  const [products, setProducts] = useState<Product[]>([]);
  const [activeLives, setActiveLives] = useState<ActiveLiveInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [addingCartId, setAddingCartId] = useState<number | null>(null);
  const [buyingId, setBuyingId] = useState<number | null>(null);

  // State untuk modal pilih jumlah saat klik ikon keranjang
  const [selectedProductForCart, setSelectedProductForCart] = useState<Product | null>(null);
  const [customQty, setCustomQty] = useState<number>(1);

  // State untuk modal lihat ulasan langsung saat klik bintang/jumlah ulasan
  const [reviewModalProduct, setReviewModalProduct] = useState<Product | null>(null);
  const [reviewsList, setReviewsList] = useState<ProductReviewItem[]>([]);
  const [reviewsStats, setReviewsStats] = useState<{ avg: number; total: number }>({
    avg: 0,
    total: 0,
  });
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);

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

  // Ambil daftar sesi LIVE aktif agar produk yang dipilih/disematkan langsung menampilkan badge & tombol LIVE
  useEffect(() => {
    const fetchActiveLives = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/live`, {
          headers: { Accept: 'application/json' },
        });
        const json = await res.json();
        if (json?.success && Array.isArray(json.data)) {
          setActiveLives(json.data);
        }
      } catch {
        // Abaikan jika endpoint live belum aktif
      }
    };

    fetchActiveLives();
    const timer = setInterval(fetchActiveLives, 10000);
    return () => clearInterval(timer);
  }, [API_BASE_URL]);

  // Cek apakah produk ini sedang dipilih/disematkan dalam siaran LIVE aktif
  const getLiveForProduct = (product: Product): ActiveLiveInfo | undefined => {
    const pinnedMatch = activeLives.find(
      (live) => Number(live.pinned_product_id) === Number(product.id)
    );
    if (pinnedMatch) return pinnedMatch;

    const sellerId = product.seller_id ?? product.seller?.id;
    if (sellerId) {
      return activeLives.find(
        (live) => !live.pinned_product_id && Number(live.seller_id) === Number(sellerId)
      );
    }
    return undefined;
  };

  /**
   * Menampilkan seluruh digit desimal apa adanya (misal: 6.000510, 6.50000)
   * tanpa memotong trailing zero maupun membulatkan angka.
   */
  const formatPiPrice = (rawVal?: string | number | null): string => {
    if (rawVal === null || rawVal === undefined || rawVal === '') return '0';
    const str = String(rawVal).trim();
    const parts = str.split('.');
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
  };

  const getDisplayPrices = (product: Product) => {
    const hasActivePromo =
      Boolean(product.is_promo_active) &&
      product.discount_price_pi !== null &&
      product.discount_price_pi !== undefined &&
      String(product.discount_price_pi).trim() !== '';

    const activeRaw = hasActivePromo ? product.discount_price_pi : product.price_pi;

    return {
      hasActivePromo,
      activeFormatted: formatPiPrice(activeRaw),
      originalFormatted: formatPiPrice(product.price_pi),
      numericPrice: Number(activeRaw ?? product.effective_price_pi ?? 0) || 0,
    };
  };

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

  const getReviewMediaUrl = (url?: string | null) => {
    if (!url || typeof url !== 'string' || url.trim() === '') return '';

    const clean = url.trim().replace(/\\/g, '/');

    if (
      (clean.startsWith('http://') || clean.startsWith('https://')) &&
      !clean.includes('nttstorepi.mejatika.com')
    ) {
      return clean;
    }

    const fileName = clean.split('/').filter(Boolean).pop();
    if (!fileName) return '';

    return `${DOMAIN_BASE_URL}/public/reviews/${fileName}`;
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

  // Buka popup ulasan langsung dari kartu produk
  const handleOpenReviewsModal = async (product: Product) => {
    const { avgRating, reviewCount } = getProductMetrics(product);
    setReviewModalProduct(product);
    setReviewsStats({ avg: avgRating, total: reviewCount });
    setReviewsList([]);
    setLoadingReviews(true);

    try {
      const res = await fetch(`${API_BASE_URL}/products/${product.id}/reviews`, {
        headers: { Accept: 'application/json' },
      });
      const json = await res.json();
      if (json?.success && json?.data) {
        setReviewsList(Array.isArray(json.data.reviews) ? json.data.reviews : []);
        setReviewsStats({
          avg: Number(json.data.average_rating ?? avgRating),
          total: Number(json.data.total_reviews ?? reviewCount),
        });
      }
    } catch (err) {
      console.error('Gagal memuat ulasan produk:', err);
    } finally {
      setLoadingReviews(false);
    }
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
    const { numericPrice } = getDisplayPrices(product);
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
          pricePi: numericPrice,
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
    const { numericPrice } = getDisplayPrices(product);
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
          pricePi: numericPrice,
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

  // Produk yang sedang LIVE ditampilkan paling atas
  const sortedProducts = [...products].sort((a, b) => {
    const aLive = getLiveForProduct(a) ? 1 : 0;
    const bLive = getLiveForProduct(b) ? 1 : 0;
    return bLive - aLive;
  });

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {sortedProducts.map((product) => {
          const imgUrl = getFullImageUrl(product.image_url);
          const isAddingThis = addingCartId === product.id;
          const isBuyingThis = buyingId === product.id;
          const { sold, remainingStock, reviewCount, avgRating } = getProductMetrics(product);
          const { hasActivePromo, activeFormatted, originalFormatted } = getDisplayPrices(product);
          const isOutOfStock = remainingStock <= 0;
          const liveSession = getLiveForProduct(product);

          return (
            <div
              key={product.id}
              className={`bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden ${
                liveSession ? 'border-rose-300 ring-2 ring-rose-500/20' : 'border-gray-100'
              }`}
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

                  {/* Badge LIVE Publik langsung di kartu produk yang dipilih penjual */}
                  {liveSession && (
                    <Link
                      href={`/live/${liveSession.room_name}`}
                      className="absolute top-2 left-2 z-20 inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md animate-pulse"
                    >
                      <Radio className="w-3 h-3" />
                      <span>LIVE • {liveSession.viewer_count}</span>
                    </Link>
                  )}

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

                {/* Tombol Klik Langsung Rating Bintang & Jumlah Ulasan */}
                <button
                  type="button"
                  onClick={() => handleOpenReviewsModal(product)}
                  title="Klik untuk melihat ulasan pembeli"
                  className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-lg hover:bg-amber-50/80 transition cursor-pointer group"
                >
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
                  <span className="text-[11px] text-amber-700 font-semibold underline decoration-amber-300 group-hover:text-amber-800">
                    ({reviewCount} ulasan)
                  </span>
                </button>

                {/* Baris Sisa Stock & Terjual (Sold) */}
                <div className="flex items-center justify-between text-[11px] mt-1.5 pt-2 border-t border-dashed border-gray-100">
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
                <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                  <div className="inline-flex items-baseline gap-1">
                    <span className="text-xs font-bold text-amber-600">π</span>
                    <span className="text-sm font-extrabold text-amber-600 break-all">
                      {activeFormatted}
                    </span>
                  </div>
                  {hasActivePromo && (
                    <span className="text-[11px] text-gray-400 line-through break-all">
                      π {originalFormatted}
                    </span>
                  )}
                </div>

                {/* Tombol Tonton Live langsung muncul pada produk yang sedang dipilih penjual */}
                {liveSession && (
                  <Link
                    href={`/live/${liveSession.room_name}`}
                    className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span>Tonton Live Sekarang</span>
                  </Link>
                )}

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

      {/* Modal Lihat Ulasan Langsung dari Kartu Produk */}
      {reviewModalProduct && (
        <div
          onClick={() => setReviewModalProduct(null)}
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 pb-20 sm:pb-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full max-h-[82vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden"
          >
            {/* Header Modal Ulasan */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {getFullImageUrl(reviewModalProduct.image_url) && (
                  <img
                    src={getFullImageUrl(reviewModalProduct.image_url)}
                    alt={reviewModalProduct.name}
                    className="w-11 h-11 rounded-xl object-cover border border-gray-100 shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <h4 className="text-sm font-extrabold text-gray-900 truncate">
                    Ulasan: {reviewModalProduct.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-gray-800">
                      {reviewsStats.total > 0 ? reviewsStats.avg.toFixed(1) : '0.0'}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      • {reviewsStats.total} ulasan pembeli
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalProduct(null)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Isi Daftar Ulasan */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
              {loadingReviews ? (
                <div className="py-10 flex flex-col items-center justify-center text-gray-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  <span className="text-xs">Memuat ulasan pembeli...</span>
                </div>
              ) : reviewsList.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <MessageSquare className="w-10 h-10 text-gray-200 mx-auto" />
                  <p className="text-xs font-semibold text-gray-600">
                    Belum ada ulasan untuk produk ini.
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Jadilah pembeli pertama yang memberikan ulasan setelah bertransaksi!
                  </p>
                </div>
              ) : (
                reviewsList.map((rev) => {
                  const reviewerName = rev.user?.name || rev.user?.username || 'Pembeli Pi';
                  return (
                    <div
                      key={rev.id}
                      className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-gray-900">{reviewerName}</span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Terverifikasi
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {new Date(rev.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              rev.rating >= s
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-200 fill-gray-200'
                            }`}
                          />
                        ))}
                      </div>

                      {rev.comment && (
                        <p className="text-xs text-gray-700 leading-relaxed">{rev.comment}</p>
                      )}

                      {/* Foto / Video Bukti Ulasan */}
                      {Array.isArray(rev.media) && rev.media.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto pt-1">
                          {rev.media.map((m, idx) => {
                            const mediaSrc = getReviewMediaUrl(m.url);
                            return m.type === 'video' ? (
                              <video
                                key={idx}
                                src={mediaSrc}
                                controls
                                className="w-20 h-20 rounded-xl object-cover border border-gray-200 bg-black shrink-0"
                              />
                            ) : (
                              <a
                                key={idx}
                                href={mediaSrc}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0"
                              >
                                <img
                                  src={mediaSrc}
                                  alt="Bukti ulasan"
                                  className="w-20 h-20 rounded-xl object-cover border border-gray-200"
                                />
                              </a>
                            );
                          })}
                        </div>
                      )}

                      {/* Balasan Penjual jika ada */}
                      {(rev.seller_reply || (rev.replies && rev.replies.length > 0)) && (
                        <div className="mt-2 pl-2.5 border-l-2 border-purple-300 space-y-1.5">
                          {rev.replies && rev.replies.length > 0 ? (
                            rev.replies.map((rep) => (
                              <div
                                key={rep.id}
                                className="p-2 rounded-xl bg-purple-50/70 border border-purple-100 text-[11px]"
                              >
                                <span className="font-bold text-purple-900 inline-flex items-center gap-1">
                                  {rep.is_seller && <Store className="w-3 h-3" />}
                                  {rep.user?.name || rep.user?.username || 'Penjual'}:
                                </span>{' '}
                                <span className="text-gray-700">{rep.comment}</span>
                              </div>
                            ))
                          ) : (
                            <div className="p-2 rounded-xl bg-purple-50/70 border border-purple-100 text-[11px]">
                              <span className="font-bold text-purple-900 inline-flex items-center gap-1">
                                <Store className="w-3 h-3" /> Respon Penjual:
                              </span>{' '}
                              <span className="text-gray-700">{rev.seller_reply}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Modal Ulasan */}
            <div className="p-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setReviewModalProduct(null)}
                className="px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
              <Link
                href={`/products/${reviewModalProduct.slug}#reviews`}
                onClick={() => setReviewModalProduct(null)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition"
              >
                <span>Buka Halaman Produk</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pilih Jumlah Produk Saat Klik Ikon Keranjang */}
      {selectedProductForCart && (() => {
        const { remainingStock } = getProductMetrics(selectedProductForCart);
        const { activeFormatted } = getDisplayPrices(selectedProductForCart);
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
                    <p className="text-xs font-extrabold text-amber-600 mt-0.5 break-all">
                      π {activeFormatted}
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
